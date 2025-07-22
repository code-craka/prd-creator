import express, { Router } from 'express';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { prdService } from '../services/prdService';
import { validateBody, validateQuery } from '../middleware/validation';
import { validationSchemas } from '../schemas/validationSchemas';
import { asyncWrapper } from '../utils/helpers';

const router = Router();

// Create new PRD
router.post('/', 
  requireAuth,
  validateBody(validationSchemas.prd.create),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const prd = await prdService.createPRD(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      data: { prd },
      message: 'PRD created successfully',
    });
  })
);

// Get user's PRDs
router.get('/', 
  requireAuth,
  validateQuery(validationSchemas.prd.filters),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const result = await prdService.getUserPRDs(req.user.id, req.query as any);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

// Get public PRDs
router.get('/public',
  validateQuery(validationSchemas.prd.filters),
  asyncWrapper(async (req: express.Request, res: express.Response) => {
    const result = await prdService.getPublicPRDs(req.query as any);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

// Get PRD by ID
router.get('/:id', 
  optionalAuth,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;
    
    const prd = await prdService.getPRD(id, req.user?.id);
    
    res.json({
      success: true,
      data: { prd },
    });
  })
);

// Update PRD
router.put('/:id',
  requireAuth,
  validateBody(validationSchemas.prd.update),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;
    
    const prd = await prdService.updatePRD(id, req.user.id, req.body);
    
    res.json({
      success: true,
      data: { prd },
      message: 'PRD updated successfully',
    });
  })
);

// Delete PRD
router.delete('/:id',
  requireAuth,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;
    
    await prdService.deletePRD(id, req.user.id);
    
    res.json({
      success: true,
      message: 'PRD deleted successfully',
    });
  })
);

// Share PRD with team
router.post('/:id/share-team',
  requireAuth,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;
    
    await prdService.sharePRDWithTeam(id, req.user.id);
    
    res.json({
      success: true,
      message: 'PRD shared with team successfully',
    });
  })
);

// Create public share link
router.post('/:id/share-public',
  requireAuth,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { id } = req.params;
    
    const shareToken = await prdService.createPublicShareLink(id, req.user.id);
    
    res.json({
      success: true,
      data: { shareToken, shareUrl: `/shared/${shareToken}` },
      message: 'Public share link created successfully',
    });
  })
);

// Get shared PRD by token
router.get('/shared/:token', 
  asyncWrapper(async (req: express.Request, res: express.Response) => {
    const { token } = req.params;
    
    const prd = await prdService.getSharedPRD(token);
    
    res.json({
      success: true,
      data: { prd },
    });
  })
);

export default router;