import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes here are protected
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Note: A change-password route would go here too
// router.put('/change-password', protect, changePassword);

export default router;