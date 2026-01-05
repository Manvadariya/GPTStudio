import express from 'express';
import {
  getUserProjects,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/project.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply the 'protect' middleware to all routes in this file
router.use(protect);

router.route('/')
  .get(getUserProjects)
  .post(createProject);

router.route('/:id')
  .put(updateProject)
  .delete(deleteProject);

export default router;