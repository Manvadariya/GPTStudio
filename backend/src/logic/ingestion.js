import path from 'path';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GitHubAzureAIEmbeddings } from '../custom-embeddings.js';
import { getCollection } from '../utils/chromaClient.js';
import crypto from 'crypto';

function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\u0000/g, '');
}

// Helper to ensure metadata values are primitives supported by ChromaDB
function sanitizeMetadata(metadata) {
  const sanitized = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) {
      sanitized[key] = "";
    } else if (typeof value === 'object') {
      try {
        sanitized[key] = JSON.stringify(value);
      } catch (e) {
        sanitized[key] = String(value);
      }
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function ingestDocument(filePath, parentDocument) {
  const { userId, ragDocumentId, fileName } = parentDocument;
  console.log(`Starting processing for: ${filePath} (User: ${userId})`);

  try {
    const fileExtension = path.extname(filePath).toLowerCase();
    let loader;
    switch (fileExtension) {
      case '.pdf': loader = new PDFLoader(filePath); break;
      case '.docx': loader = new DocxLoader(filePath); break;
      case '.txt': loader = new TextLoader(filePath); break;
      default: throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const chunks = await splitter.splitDocuments(docs);
    console.log(`-> Split into ${chunks.length} chunks.`);

    if (chunks.length === 0) {
      throw new Error('No content could be extracted from the document.');
    }

    const taggedChunks = chunks.map(chunk => ({
      pageContent: sanitizeText(chunk.pageContent),
      metadata: sanitizeMetadata({ ...chunk.metadata, source: fileName, userId: userId.toString(), documentId: ragDocumentId })
    }));

    const embeddingsGenerator = new GitHubAzureAIEmbeddings();
    console.log('Generating embeddings...');
    const chunkEmbeddings = await embeddingsGenerator.embedDocuments(taggedChunks.map(chunk => chunk.pageContent));

    // Prepare data for ChromaDB
    const ids = taggedChunks.map(() => crypto.randomUUID());
    const embeddings = chunkEmbeddings;
    const metadatas = taggedChunks.map(chunk => chunk.metadata);
    const documents = taggedChunks.map(chunk => chunk.pageContent);

    // Insert into ChromaDB
    const collection = await getCollection();
    console.log(`Inserting ${ids.length} chunks into ChromaDB...`);

    await collection.add({
      ids,
      embeddings,
      metadatas,
      documents
    });

    // --- IMPORTANT: Update parent document status ---
    parentDocument.status = 'ready';
    await parentDocument.save();

    console.log(`✅ Success! Document ${fileName} processed and stored in ChromaDB.`);
    return ragDocumentId;

  } catch (error) {
    console.error(`❌ Ingestion failed for document ${parentDocument._id}:`, error);
    // --- IMPORTANT: Update parent document status on failure ---
    parentDocument.status = 'error';
    await parentDocument.save();
    throw error; // Re-throw to be caught by the controller
  }
}

export async function ingestWebsite(url, parentDocument) {
  const { userId, ragDocumentId } = parentDocument;
  console.log(`Starting web ingestion for: ${url} (User: ${userId})`);

  try {
    const { crawlWebsite } = await import('./webCrawler.js');
    const { RecursiveCharacterTextSplitter } = await import('langchain/text_splitter');

    // Crawl and extract content (depth 2 by default)
    const crawledPages = await crawlWebsite(url, 2, 20);

    if (crawledPages.length === 0) {
      throw new Error('No content could be extracted from the website.');
    }

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    let allTaggedChunks = [];

    for (const page of crawledPages) {
      const docs = await splitter.createDocuments([page.text], [{
        source: 'web',
        sourceUrl: page.url,
        page_title: page.title,
        ingestion_timestamp: page.crawledAt,
        userId: userId.toString(),
        documentId: ragDocumentId
      }]);

      const tagged = docs.map(doc => ({
        pageContent: sanitizeText(doc.pageContent),
        metadata: sanitizeMetadata(doc.metadata)
      }));

      allTaggedChunks.push(...tagged);
    }

    console.log(`-> Extracted total ${allTaggedChunks.length} chunks from ${crawledPages.length} pages.`);

    if (allTaggedChunks.length === 0) {
      throw new Error('Content extracted but no valid chunks generated.');
    }

    const embeddingsGenerator = new GitHubAzureAIEmbeddings();
    console.log('Generating embeddings for web chunks...');

    // Process in batches if too many chunks to avoid memory/rate limits
    const batchSize = 100;
    const ids = [];
    const embeddings = [];
    const metadatas = [];
    const documents = [];

    for (let i = 0; i < allTaggedChunks.length; i += batchSize) {
      const batch = allTaggedChunks.slice(i, i + batchSize);
      const batchTexts = batch.map(c => c.pageContent);

      const batchEmbeddings = await embeddingsGenerator.embedDocuments(batchTexts);

      batch.forEach((chunk, idx) => {
        ids.push(crypto.randomUUID());
        embeddings.push(batchEmbeddings[idx]);
        metadatas.push(chunk.metadata);
        documents.push(chunk.pageContent);
      });
      console.log(`Processed batch ${i / batchSize + 1}/${Math.ceil(allTaggedChunks.length / batchSize)}`);
    }

    // Insert into ChromaDB
    const collection = await getCollection();
    console.log(`Inserting ${ids.length} web chunks into ChromaDB...`);

    // Insert in batches of 500 max to be safe with Chroma
    const chromaBatchSize = 500;
    for (let i = 0; i < ids.length; i += chromaBatchSize) {
      const sliceEnd = Math.min(i + chromaBatchSize, ids.length);
      await collection.add({
        ids: ids.slice(i, sliceEnd),
        embeddings: embeddings.slice(i, sliceEnd),
        metadatas: metadatas.slice(i, sliceEnd),
        documents: documents.slice(i, sliceEnd)
      });
    }

    // --- IMPORTANT: Update parent document status ---
    parentDocument.status = 'ready';
    parentDocument.fileSize = allTaggedChunks.length; // Store chunk count as size approximation
    await parentDocument.save();

    console.log(`✅ Success! Website ${url} processed and stored in ChromaDB.`);
    return ragDocumentId;

  } catch (error) {
    console.error(`❌ Web ingestion failed for ${url}:`, error);
    parentDocument.status = 'error';
    await parentDocument.save();
    throw error;
  }
}
