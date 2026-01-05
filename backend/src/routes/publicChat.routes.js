import express from 'express';
import { apiKeyProtect } from '../middleware/apiKeyAuth.middleware.js';
import { handlePublicChat } from '../controllers/publicChat.controller.js';

const router = express.Router();

// This route is protected by our API key middleware, not the user JWT middleware
router.post('/', apiKeyProtect, handlePublicChat);

export default router;