import express from 'express';
import Joi from 'joi';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { ValidationError } from '../middleware/errorHandler';
import { analyticsService } from '../services/analyticsService';

const router = express.Router();

// Validation schemas
const trackEventSchema = Joi.object({
  eventType: Joi.string().required(),
  eventCategory: Joi.string().required(),
  eventData: Joi.object().optional(),
  prdId: Joi.string().uuid().optional(),
  sessionId: Joi.string().optional(),
});

const analyticsQuerySchema = Joi.object({
  timeRange: Joi.string().valid('7d', '30d', '90d').default('30d'),
  teamId: Joi.string().uuid().optional(),
});

// Simple validation middleware
const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details,
      });
    }
    next();
  };
};

const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details,
      });
    }
    req.query = value;
    next();
  };
};

// Async wrapper
const asyncWrapper = (fn: Function) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Track analytics event
router.post('/events',
  requireAuth,
  validateBody(trackEventSchema),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { eventType, eventCategory, eventData, prdId, sessionId } = req.body;
    
    await analyticsService.trackEvent({
      userId: req.user!.id,
      teamId: req.headers['x-team-id'] as string,
      prdId,
      eventType,
      eventCategory,
      eventData,
      sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'Event tracked successfully',
    });
  })
);

// Get team productivity metrics
router.get('/team-productivity',
  requireAuth,
  validateQuery(analyticsQuerySchema),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { timeRange } = req.query as { timeRange?: string };
    const teamId = req.headers['x-team-id'] as string;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'Team ID is required',
      });
    }

    const metrics = await analyticsService.getTeamProductivityMetrics(teamId, timeRange as string);

    res.json({
      success: true,
      data: metrics,
    });
  })
);

// Get PRD creation trends
router.get('/prd-trends',
  requireAuth,
  validateQuery(analyticsQuerySchema),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { timeRange, teamId } = req.query as { timeRange?: string; teamId?: string };
    const currentTeamId = teamId || req.headers['x-team-id'] as string;

    const trends = await analyticsService.getPRDTrends(currentTeamId, timeRange as string);

    res.json({
      success: true,
      data: trends,
    });
  })
);

// Get template usage statistics
router.get('/template-usage',
  requireAuth,
  validateQuery(analyticsQuerySchema),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.query as { teamId?: string };
    const currentTeamId = teamId || req.headers['x-team-id'] as string;

    const templateStats = await analyticsService.getTemplateUsageStats(currentTeamId);

    res.json({
      success: true,
      data: templateStats,
    });
  })
);

// Get user engagement insights
router.get('/user-engagement',
  requireAuth,
  validateQuery(analyticsQuerySchema),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { teamId } = req.query as { teamId?: string };
    const currentTeamId = teamId || req.headers['x-team-id'] as string;

    const insights = await analyticsService.getUserEngagementInsights(currentTeamId);

    res.json({
      success: true,
      data: insights,
    });
  })
);

// Get analytics dashboard overview
router.get('/dashboard',
  requireAuth,
  validateQuery(analyticsQuerySchema),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { timeRange, teamId } = req.query as { timeRange?: string; teamId?: string };
    const currentTeamId = teamId || req.headers['x-team-id'] as string;

    if (!currentTeamId) {
      return res.status(400).json({
        success: false,
        error: 'Team ID is required',
      });
    }

    // Get all analytics data in parallel
    const [
      teamProductivity,
      prdTrends,
      templateUsage,
      userEngagement,
    ] = await Promise.all([
      analyticsService.getTeamProductivityMetrics(currentTeamId, timeRange as string),
      analyticsService.getPRDTrends(currentTeamId, timeRange as string),
      analyticsService.getTemplateUsageStats(currentTeamId),
      analyticsService.getUserEngagementInsights(currentTeamId),
    ]);

    res.json({
      success: true,
      data: {
        teamProductivity,
        prdTrends,
        templateUsage: templateUsage.slice(0, 10), // Top 10 templates
        userEngagement,
        generatedAt: new Date().toISOString(),
      },
    });
  })
);

// Get analytics summary for multiple teams (admin only)
router.get('/overview',
  requireAuth,
  validateQuery(Joi.object({
    timeRange: Joi.string().valid('7d', '30d', '90d').default('30d'),
  })),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    // This endpoint could be restricted to admin users in the future
    const { timeRange } = req.query as { timeRange?: string };

    const [
      globalPrdTrends,
      globalTemplateUsage,
      globalUserEngagement,
    ] = await Promise.all([
      analyticsService.getPRDTrends(undefined, timeRange as string),
      analyticsService.getTemplateUsageStats(undefined),
      analyticsService.getUserEngagementInsights(undefined),
    ]);

    res.json({
      success: true,
      data: {
        globalTrends: globalPrdTrends,
        popularTemplates: globalTemplateUsage.slice(0, 15),
        userEngagement: globalUserEngagement,
        generatedAt: new Date().toISOString(),
      },
    });
  })
);

export default router;