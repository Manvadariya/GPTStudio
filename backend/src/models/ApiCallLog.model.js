import mongoose from 'mongoose';

const ApiCallLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project', index: true },
  successful: { type: Boolean, required: true },
  responseTimeMs: { type: Number, required: true },
  
  // In a real production system, you'd get this from the AI provider's response.
  // We will simulate it for now.
  tokensUsed: { type: Number, default: 0 }, 
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Index the creation date for fast time-series queries
ApiCallLogSchema.index({ createdAt: 1 });

export const ApiCallLog = mongoose.model('ApiCallLog', ApiCallLogSchema);