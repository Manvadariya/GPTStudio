import mongoose from 'mongoose';
import crypto from 'crypto';

const ApiKeySchema = new mongoose.Schema({
  name: { type: String, required: true },
  keyPrefix: { type: String, required: true },
  hashedKey: { type: String, required: true, select: false },
  lastFour: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  
  // --- THE CRITICAL ADDITION ---
  // Each API key is now linked to exactly one project.
  projectId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project' },

  lastUsed: { type: Date, default: null },
  usage: { type: Number, default: 0 },
}, { timestamps: true });

ApiKeySchema.statics.hashKey = function(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
};

export const ApiKey = mongoose.model('ApiKey', ApiKeySchema);