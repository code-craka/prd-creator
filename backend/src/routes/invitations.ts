import express from 'express';
import { requireAuth, BackendAuthenticatedRequest } from '../middleware/auth';
import { memberService } from '../services/memberService';
import { asyncWrapper } from '../utils/helpers';

const router = express.Router();

// Accept invitation via token
router.post('/accept/:token',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { token } = req.params;
    
    const result = await memberService.acceptInvitation(token, req.user.id);
    
    res.json({
      success: true,
      data: result,
      message: 'Invitation accepted successfully',
    });
  })
);

// Get invitation details (for preview before accepting)
router.get('/:token',
  asyncWrapper(async (req: express.Request, res: express.Response) => {
    const { token } = req.params;
    
    // This would be a public endpoint to show invitation details
    // Implementation would fetch invitation without requiring auth
    
    res.json({
      success: true,
      message: 'Invitation details endpoint - to be implemented',
    });
  })
);

export default router;