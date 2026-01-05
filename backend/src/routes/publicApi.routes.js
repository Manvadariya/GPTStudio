import express from 'express';
import { authenticateApiKey } from '../middleware/apiKey.middleware.js';
import { handlePublicChat } from '../controllers/publicChat.controller.js';

const router = express.Router();

// The single endpoint for all public, API-key-based chat
router.post('/chat', authenticateApiKey, handlePublicChat);

export default router;