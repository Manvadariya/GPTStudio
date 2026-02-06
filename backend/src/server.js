import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import userRoutes from './routes/user.routes.js';
import apiKeyRoutes from './routes/apiKey.routes.js';
import dataRoutes from './routes/data.routes.js';
import chatRoutes from './routes/chat.routes.js';
import publicChatRoutes from './routes/publicChat.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';


// Validate essential environment variables
if (!process.env.APP_MONGO_URI) {
  console.error("FATAL ERROR: Make sure APP_MONGO_URI is defined in your .env file.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware Setup ---
// Allow requests from your frontend development server
app.use(cors()); // Allow all origins for production deployment
app.use(express.json()); // To parse JSON request bodies

// --- Database Connections ---
// Connection for Application Data (Users, etc.)
mongoose.connect(process.env.APP_MONGO_URI)
  .then(() => console.log('✅ Connected to Application Database (ai_platform_db).'))
  .catch(err => {
    console.error('❌ Application DB Connection Error:', err);
    process.exit(1);
  });

// Note: The RAG DB connection will be handled by LangChain's MongoDB loaders directly.

// --- Verify ChromaDB Connection ---
import { getCollection } from './utils/chromaClient.js';
import { getEmbeddings } from './custom-embeddings.js';

// Warmup: Pre-initialize connections to eliminate cold-start latency
Promise.all([
  getCollection(),
  Promise.resolve(getEmbeddings()) // Warmup embeddings client
]).then(([collection]) => {
  console.log(`✅ Connected to ChromaDB Cloud (Collection: ${collection.name}).`);
  console.log('✅ Embeddings client warmed up.');
}).catch(err => {
  console.error('❌ Warmup Error:', err);
});

// --- API Routes ---

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/v1/chat', publicChatRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- Serve Static Frontend (Production) ---
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Handle React Client-Side Routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// --- Start the Server ---
app.listen(PORT, () => console.log(`🚀 Server is listening on http://localhost:${PORT}`));