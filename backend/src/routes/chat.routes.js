import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { handleChat } from '../controllers/chat.controller.js';

const router = express.Router();
router.use(protect);

// This now matches your spec: POST /api/chat
router.post('/', handleChat);

export default router;