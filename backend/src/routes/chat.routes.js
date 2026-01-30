import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { apiKeyProtect } from '../middleware/apiKeyAuth.middleware.js';
import { handleChat, handleStreamingChat } from '../controllers/chat.controller.js';

const router = express.Router();

// Hybrid middleware to support both JWT (user) and API Key (system)
const hybridProtect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    // Check if it looks like an API Key (starts with sk-)
    if (authHeader && authHeader.trim().split(' ')[1]?.startsWith('sk-')) {
        return apiKeyProtect(req, res, next);
    }
    // Otherwise, assume it's a User JWT
    return protect(req, res, next);
};

// Apply hybrid protection to all routes in this router
router.use(hybridProtect);

// Non-streaming chat: POST /api/chat
router.post('/', handleChat);

// Streaming chat (SSE): POST /api/chat/stream
router.post('/stream', handleStreamingChat);

export default router;