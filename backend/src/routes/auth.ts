import express from 'express';
import { requireAuth, BackendAuthenticatedRequest } from '../middleware/auth';
import { AuthService } from '../services/authService';
import { validateBody } from '../middleware/validation';
import { validationSchemas } from '../schemas/validationSchemas';
import { asyncWrapper } from '../utils/helpers';

const router = express.Router();

// Register new user
router.post('/register', 
  validateBody(validationSchemas.auth.register),
  asyncWrapper(async (req: express.Request, res: express.Response) => {
    const { email, name, password } = req.body;
    
    const authResponse = await AuthService.register(email, name, password);
    
    res.status(201).json({
      success: true,
      data: authResponse,
      message: 'User registered successfully',
    });
  })
);

// Login user
router.post('/login',
  validateBody(validationSchemas.auth.login),
  asyncWrapper(async (req: express.Request, res: express.Response) => {
    const { email, password } = req.body;
    
    const authResponse = await AuthService.login(email, password);
    
    res.json({
      success: true,
      data: authResponse,
      message: 'Login successful',
    });
  })
);

// Get current user
router.get('/me', 
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const user = await AuthService.getCurrentUser(req.user.id);
    
    res.json({
      success: true,
      data: { user },
    });
  })
);

// Update user profile
router.put('/profile',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { name, avatar_url } = req.body;
    
    const user = await AuthService.updateProfile(req.user.id, {
      name,
      avatar_url,
    });
    
    res.json({
      success: true,
      data: { user },
      message: 'Profile updated successfully',
    });
  })
);

// Change password
router.post('/change-password',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { currentPassword, newPassword } = req.body;
    
    await AuthService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

// Logout (client-side only, token invalidation would require Redis/blacklist)
router.post('/logout', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

export default router;