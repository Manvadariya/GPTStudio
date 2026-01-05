import express from 'express';
import { getApiKeys, generateApiKey, deleteApiKey } from '../controllers/apiKey.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getApiKeys)
  .post(generateApiKey);

router.route('/:id').delete(deleteApiKey);

export default router;