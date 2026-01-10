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
