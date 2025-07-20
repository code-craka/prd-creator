import express from 'express';
import { query } from 'express-validator';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { asyncWrapper } from '../utils/helpers';
import { growthAnalyticsService } from '../services/growthAnalyticsService';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get growth dashboard
router.get('/dashboard',
  requireAuth,
  [
    query('timeRange').optional().isIn(['7d', '30d', '90d'])
  ],
  validateRequest,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const timeRange = req.query.timeRange as '7d' | '30d' | '90d' || '30d';

    const dashboard = await growthAnalyticsService.getGrowthDashboard(timeRange);

    res.json({
      success: true,
      data: dashboard
    });
  })
);

// Get conversion funnel
router.get('/funnel',
  requireAuth,
  [
    query('timeRange').optional().isIn(['7d', '30d', '90d'])
  ],
  validateRequest,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const timeRange = req.query.timeRange as '7d' | '30d' | '90d' || '30d';
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    const endDate = new Date();

    const funnel = await growthAnalyticsService.getConversionFunnel(startDate, endDate);

    res.json({
      success: true,
      data: funnel
    });
  })
);

// Get growth metrics
router.get('/metrics',
  requireAuth,
  [
    query('timeRange').optional().isIn(['7d', '30d', '90d'])
  ],
  validateRequest,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const timeRange = req.query.timeRange as '7d' | '30d' | '90d' || '30d';
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    const endDate = new Date();

    const metrics = await growthAnalyticsService.calculateGrowthMetrics(startDate, endDate);

    res.json({
      success: true,
      data: metrics
    });
  })
);

// Get growth trends
router.get('/trends/:metricType',
  requireAuth,
  [
    query('timeRange').optional().isIn(['7d', '30d', '90d']),
    query('segment').optional().isLength({ min: 1, max: 50 })
  ],
  validateRequest,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const { metricType } = req.params;
    const timeRange = req.query.timeRange as '7d' | '30d' | '90d' || '30d';
    const segment = req.query.segment as string || 'all';

    const validMetricTypes = ['viral_coefficient', 'conversion_rate', 'retention'] as const;
    type ValidMetricType = typeof validMetricTypes[number];

    if (!validMetricTypes.includes(metricType as ValidMetricType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid metric type'
      });
    }

    const trends = await growthAnalyticsService.getGrowthTrends(
      metricType as ValidMetricType,
      timeRange,
      segment
    );

    res.json({
      success: true,
      data: trends
    });
  })
);

// Get cohort analysis
router.get('/cohorts',
  requireAuth,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const cohortAnalysis = await growthAnalyticsService.generateCohortAnalysis();

    res.json({
      success: true,
      data: cohortAnalysis
    });
  })
);

// Track conversion event
router.post('/track',
  [
    query('sessionId').isUUID(),
    query('eventType').isIn(['page_view', 'signup', 'activation', 'conversion']),
    query('pageName').optional().isLength({ min: 1, max: 100 }),
    query('variantId').optional().isUUID(),
    query('utmSource').optional().isLength({ min: 1, max: 100 }),
    query('utmMedium').optional().isLength({ min: 1, max: 100 }),
    query('utmCampaign').optional().isLength({ min: 1, max: 100 }),
    query('referrerUrl').optional().isURL()
  ],
  validateRequest,
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    const sessionId = req.query.sessionId as string;
    const validEventTypes = ['page_view', 'signup', 'activation', 'conversion'] as const;
    type ValidEventType = typeof validEventTypes[number];
    const eventType = req.query.eventType as ValidEventType;
    const userId = req.user?.id || null;

    const eventData = {
      page_name: req.query.pageName as string,
      variant_id: req.query.variantId as string,
      utm_source: req.query.utmSource as string,
      utm_medium: req.query.utmMedium as string,
      utm_campaign: req.query.utmCampaign as string,
      referrer_url: req.query.referrerUrl as string
    };

    await growthAnalyticsService.trackConversionEvent(
      sessionId,
      userId,
      eventType,
      eventData
    );

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  })
);

export default router;