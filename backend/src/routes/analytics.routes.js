import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getAnalytics } from '../controllers/analytics.controller.js';

const router = express.Router();

// Protect this route to ensure only logged-in users can see their own analytics
router.get('/', protect, getAnalytics);

export default router;