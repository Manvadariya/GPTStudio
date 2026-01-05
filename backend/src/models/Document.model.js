import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String, required: true },
  status: {
    type: String,
    enum: ['processing', 'ready', 'error'],
    default: 'processing',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  // This will store the unique ID that links all chunks of this document together
  ragDocumentId: {
    type: String,
    required: true,
    unique: true,
  }
}, { timestamps: true });

export const Document = mongoose.model('Document', DocumentSchema);