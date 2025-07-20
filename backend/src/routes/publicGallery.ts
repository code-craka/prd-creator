import express from 'express';
import { body, param, query } from 'express-validator';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { asyncWrapper } from '../utils/asyncWrapper';
import { publicGalleryService } from '../services/publicGalleryService';
import { AuthenticatedRequest } from '../types/auth';

const router = express.Router();

// Get public PRDs with filters
router.get('/prds',
  [
    query('category').optional().isIn(['featured', 'trending', 'community']),
    query('industry').optional().isLength({ min: 1, max: 50 }),
    query('complexity_level').optional().isIn(['beginner', 'intermediate', 'advanced']),
    query('tags').optional().isArray(),
    query('search').optional().isLength({ min: 1, max: 100 }),
    query('sort_by').optional().isIn(['newest', 'popular', 'trending', 'most_liked']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ],
  validateRequest,
  asyncWrapper(async (req: express.Request, res: express.Response) => {
    const filters = {
      category: req.query.category as any,
      industry: req.query.industry as string,
      complexity_level: req.query.complexity_level as any,
      tags: req.query.tags as string[],
      search: req.query.search as string,
      sort_by: req.query.sort_by as any,
      page: req.query.page as number || 1,
      limit: req.query.limit as number || 12
    };

    const result = await publicGalleryService.getPublicPRDs(filters);

    res.json({
      success: true,
      data: result
    });
  })
);

// Get single public PRD by slug
router.get('/prds/:slug',
  [
    param('slug').isSlug()
  ],
  validateRequest,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { slug } = req.params;
    const viewerId = req.user?.id;

    const prd = await publicGalleryService.getPublicPRDBySlug(slug, viewerId);

    if (!prd) {
      return res.status(404).json({
        success: false,
        error: 'PRD not found'
      });
    }

    res.json({
      success: true,
      data: prd
    });
  })
);

// Publish PRD to gallery
router.post('/prds/:prdId/publish',
  requireAuth,
  [
    param('prdId').isUUID(),
    body('title').isLength({ min: 1, max: 200 }),
    body('description').optional().isLength({ min: 1, max: 500 }),
    body('industry').isLength({ min: 1, max: 50 }),
    body('complexity_level').isIn(['beginner', 'intermediate', 'advanced']),
    body('tags').optional().isArray({ max: 10 }),
    body('seo_description').optional().isLength({ min: 1, max: 160 })
  ],
  validateRequest,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { prdId } = req.params;
    const userId = req.user!.id;

    try {
      const publicPRD = await publicGalleryService.publishPRD(userId, prdId, req.body);

      res.status(201).json({
        success: true,
        data: publicPRD,
        message: 'PRD published to gallery successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  })
);

// Like/unlike PRD
router.post('/prds/:prdId/like',
  requireAuth,
  [
    param('prdId').isUUID()
  ],
  validateRequest,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { prdId } = req.params;
    const userId = req.user!.id;

    const result = await publicGalleryService.toggleLike(prdId, userId);

    res.json({
      success: true,
      data: result
    });
  })
);

// Share PRD
router.post('/prds/:prdId/share',
  requireAuth,
  [
    param('prdId').isUUID(),
    body('platform').isIn(['twitter', 'linkedin', 'email', 'slack', 'copy_link']),
    body('share_text').optional().isLength({ min: 1, max: 280 }),
    body('hashtags').optional().isArray({ max: 5 })
  ],
  validateRequest,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { prdId } = req.params;
    const userId = req.user!.id;

    const result = await publicGalleryService.sharePRD(prdId, userId, req.body);

    res.json({
      success: true,
      data: result
    });
  })
);

// Clone PRD
router.post('/prds/:prdId/clone',
  requireAuth,
  [
    param('prdId').isUUID()
  ],
  validateRequest,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { prdId } = req.params;
    const userId = req.user!.id;

    const result = await publicGalleryService.clonePRD(prdId, userId);

    res.json({
      success: true,
      data: result,
      message: 'PRD cloned successfully'
    });
  })
);

// Feature PRD (admin only)
router.post('/prds/:prdId/feature',
  requireAuth,
  [
    param('prdId').isUUID(),
    body('reason').isLength({ min: 1, max: 200 }),
    body('featured_until').optional().isISO8601()
  ],
  validateRequest,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { prdId } = req.params;
    const { reason, featured_until } = req.body;

    // TODO: Add admin role check
    // if (!req.user!.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Admin access required'
    //   });
    // }

    const featuredUntil = featured_until ? new Date(featured_until) : undefined;
    const result = await publicGalleryService.featurePRD(prdId, reason, featuredUntil);

    res.json({
      success: true,
      data: result,
      message: 'PRD featured successfully'
    });
  })
);

// Update trending PRDs (internal job)
router.post('/update-trending',
  requireAuth,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    // TODO: Add admin role check or API key authentication
    await publicGalleryService.updateTrendingPRDs();

    res.json({
      success: true,
      message: 'Trending PRDs updated successfully'
    });
  })
);

// Get gallery statistics
router.get('/stats',
  asyncWrapper(async (req: express.Request, res: express.Response) => {
    const stats = await publicGalleryService.getGalleryStats();

    res.json({
      success: true,
      data: stats
    });
  })
);

export default router;