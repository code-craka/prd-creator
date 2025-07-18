import express from 'express';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - will be implemented with services
router.get('/profile', requireAuth, (req, res) => {
  res.json({ message: 'Get user profile endpoint - to be implemented' });
});

router.put('/profile', requireAuth, (req, res) => {
  res.json({ message: 'Update user profile endpoint - to be implemented' });
});

export default router;