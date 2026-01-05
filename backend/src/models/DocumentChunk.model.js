import mongoose from 'mongoose';

const DocumentChunkSchema = new mongoose.Schema({
  content: { type: String, required: true },
  embedding: { type: [Number], required: true },
  userId: { type: String, required: true, index: true }, // Storing as String to match ingestion logic
  documentId: { type: String, required: true, index: true }, // This is the ragDocumentId
  metadata: { type: Object, required: true },
}, { collection: 'document_chunks' }); // Explicitly set collection name

// IMPORTANT: This model will be used with the RAG database connection, not the default one.
export { DocumentChunkSchema };