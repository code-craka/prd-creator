import express from 'express';
import { requireAuth, BackendAuthenticatedRequest } from '../middleware/auth';
import { analyticsService } from '../services/analyticsService';
import { validateBody, validateQuery } from '../middleware/validation';
import { validationSchemas } from '../schemas/validationSchemas';
import { asyncWrapper } from '../utils/helpers';

const router = express.Router();

// Track analytics event
router.post('/events',
  requireAuth,
  validateBody(validationSchemas.analytics.trackEvent),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
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
  validateQuery(validationSchemas.analytics.query),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
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
  validateQuery(validationSchemas.analytics.query),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
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
  validateQuery(validationSchemas.analytics.query),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
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
  validateQuery(validationSchemas.analytics.query),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
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
  validateQuery(validationSchemas.analytics.dashboard),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { timeRange, teamId } = req.query as { timeRange?: string; teamId?: string };
    const currentTeamId = teamId || req.headers['x-team-id'] as string;

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

// Get user-specific analytics
router.get('/my-stats',
  requireAuth,
  validateQuery(validationSchemas.analytics.query),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { timeRange } = req.query as { timeRange?: string };
    
    // This would require a getUserStats method in analyticsService
    // For now, return basic user data
    res.json({
      success: true,
      data: {
        userId: req.user!.id,
        timeRange: timeRange || '30d',
        // Add user-specific analytics here
      },
    });
  })
);

// Get detailed analytics data with filters
router.get('/detailed',
  requireAuth,
  validateQuery(validationSchemas.analytics.query),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { 
      timeRange, 
      teamId, 
      eventType, 
      eventCategory, 
      prdId, 
      page, 
      limit 
    } = req.query as { 
      timeRange?: string;
      teamId?: string;
      eventType?: string;
      eventCategory?: string;
      prdId?: string;
      page?: number;
      limit?: number;
    };
    
    const currentTeamId = teamId || req.headers['x-team-id'] as string;

    // This would require a getDetailedAnalytics method in analyticsService
    // For now, return basic data structure
    res.json({
      success: true,
      data: {
        filters: {
          timeRange: timeRange || '30d',
          teamId: currentTeamId,
          eventType,
          eventCategory,
          prdId,
        },
        pagination: {
          page: page || 1,
          limit: limit || 50,
        },
        events: [], // Would contain filtered analytics events
      },
    });
  })
);

// Export custom analytics report
router.post('/export',
  requireAuth,
  validateBody(validationSchemas.analytics.query),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { timeRange, teamId, eventType, eventCategory } = req.body;
    const currentTeamId = teamId || req.headers['x-team-id'] as string;

    // This would require an exportAnalytics method in analyticsService
    // For now, return export confirmation
    res.json({
      success: true,
      data: {
        exportId: `export_${Date.now()}`,
        status: 'generating',
        filters: {
          timeRange,
          teamId: currentTeamId,
          eventType,
          eventCategory,
        },
      },
      message: 'Analytics export initiated',
    });
  })
);

export default router;