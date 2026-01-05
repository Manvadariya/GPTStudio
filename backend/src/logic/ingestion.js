import path from 'path';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import mongoose from 'mongoose';
import { DocumentChunkSchema } from '../models/DocumentChunk.model.js';
import { GitHubAzureAIEmbeddings } from '../custom-embeddings.js';
import { Document } from '../models/Document.model.js'; // Import parent document model

// Create a dedicated connection to the RAG database
let ragDbConnection = null;
const getRagDbConnection = async () => {
  if (!ragDbConnection || ragDbConnection.readyState !== 1) {
    console.log('Creating new connection to RAG database...');
    ragDbConnection = mongoose.createConnection(process.env.RAG_MONGO_URI);
    await ragDbConnection.asPromise();
    console.log('✅ Connected to RAG Database (rag_db).');
  }
  return ragDbConnection;
};

function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\u0000/g, '');
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
      metadata: { ...chunk.metadata, source: fileName, userId, documentId: ragDocumentId }
    }));
    
    const embeddings = new GitHubAzureAIEmbeddings();
    console.log('Generating embeddings...');
    const chunkEmbeddings = await embeddings.embedDocuments(taggedChunks.map(chunk => chunk.pageContent));
    
    const documentsToInsert = taggedChunks.map((chunk, index) => ({
      content: chunk.pageContent,
      embedding: chunkEmbeddings[index],
      metadata: chunk.metadata,
      userId: chunk.metadata.userId.toString(), // Ensure userId is a string
      documentId: chunk.metadata.documentId,
    }));

    const ragConnection = await getRagDbConnection();
    const DocumentChunk = ragConnection.model('DocumentChunk', DocumentChunkSchema);

    console.log(`Inserting ${documentsToInsert.length} chunks into MongoDB...`);
    await DocumentChunk.insertMany(documentsToInsert);
    
    // --- IMPORTANT: Update parent document status ---
    parentDocument.status = 'ready';
    await parentDocument.save();

    console.log(`✅ Success! Document ${fileName} processed and stored.`);
    return ragDocumentId;

  } catch (error) {
    console.error(`❌ Ingestion failed for document ${parentDocument._id}:`, error);
    // --- IMPORTANT: Update parent document status on failure ---
    parentDocument.status = 'error';
    await parentDocument.save();
    throw error; // Re-throw to be caught by the controller
  }
}