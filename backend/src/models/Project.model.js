import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['development', 'testing', 'deployed'], default: 'development' },
    model: { type: String, required: true },
    version: { type: String, default: '1.0.0' },
    apiCalls: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },

    // --- NEW FIELDS TO STORE RAG CONFIGURATION ---
    documents: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Document' // Creates a reference to our Document model
    }],
    temperature: { 
      type: Number, 
      default: 0.7, 
      min: 0, 
      max: 2 
    },
    systemPrompt: { 
      type: String, 
      default: 'You are a helpful assistant.',
      trim: true
    },
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model('Project', ProjectSchema);