import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { protect } from '../middleware/auth.middleware.js';
import { getDataSources, uploadDataSource, deleteDataSource, ingestUrl } from '../controllers/data.controller.js';

const router = express.Router();

// Ensure the path is relative to the backend directory, not the project root
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// --- START: THE FIX ---
// Replace the old multer config with this one that preserves file extensions.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save files to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    // Use a timestamp to prevent filename conflicts, but keep the original name and extension
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });
// --- END: THE FIX ---

// Protect all data routes with authentication middleware
router.use(protect);

// GET /api/data - Fetches all data sources for the user
router.get('/', getDataSources);

// POST /api/data/upload - Handles file uploads
router.post('/upload', upload.single('file'), uploadDataSource);

// POST /api/data/ingest-url - Handles website ingestion
router.post('/ingest-url', ingestUrl);

// DELETE /api/data/:id - Deletes a specific data source
router.delete('/:id', deleteDataSource);

export default router;