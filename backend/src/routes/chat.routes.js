import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { handleChat, handleStreamingChat } from '../controllers/chat.controller.js';

const router = express.Router();
router.use(protect);

// Non-streaming chat: POST /api/chat
router.post('/', handleChat);

// Streaming chat (SSE): POST /api/chat/stream
router.post('/stream', handleStreamingChat);

export default router;