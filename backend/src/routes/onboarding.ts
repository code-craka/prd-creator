import express from 'express';
import { body, param, query } from 'express-validator';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { asyncWrapper, safeParsePositiveInt } from '../utils/helpers';
import { onboardingService } from '../services/onboardingService';
import { BackendAuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Initialize onboarding for current user
router.post('/initialize',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const onboarding = await onboardingService.initializeUserOnboarding(req.user!.id);

    res.json({
      success: true,
      data: onboarding
    });
  })
);

// Get current user's onboarding progress
router.get('/progress',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const progress = await onboardingService.getUserOnboardingProgress(req.user.id);

    res.json({
      success: true,
      data: progress
    });
  })
);

// Update user profile during onboarding
router.put('/profile',
  requireAuth,
  [
    body('companyType').optional().isIn(['startup', 'enterprise', 'agency', 'freelancer']),
    body('industry').optional().isLength({ min: 1, max: 50 }),
    body('teamSize').optional().isIn(['solo', 'small', 'medium', 'large']),
    body('experienceLevel').optional().isIn(['beginner', 'intermediate', 'expert']),
    body('preferences').optional().isObject()
  ],
  validateRequest,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const onboarding = await onboardingService.updateUserProfile(req.user!.id, req.body);

    res.json({
      success: true,
      data: onboarding
    });
  })
);

// Get personalized template recommendations
router.get('/templates/recommendations',
  requireAuth,
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ],
  validateRequest,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const limit = safeParsePositiveInt(req.query.limit as string, 10);
    const recommendations = await onboardingService.getTemplateRecommendations(req.user!.id, limit);

    res.json({
      success: true,
      data: recommendations
    });
  })
);

// Get all tutorial steps
router.get('/tutorial/steps',
  requireAuth,
  [
    query('category').optional().isLength({ min: 1, max: 50 })
  ],
  validateRequest,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const category = req.query.category as string;
    const steps = await onboardingService.getTutorialSteps(category);

    res.json({
      success: true,
      data: steps
    });
  })
);

// Start a tutorial step
router.post('/tutorial/steps/:stepId/start',
  requireAuth,
  [
    param('stepId').isUUID()
  ],
  validateRequest,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { stepId } = req.params;
    await onboardingService.startTutorialStep(req.user!.id, stepId);

    res.json({
      success: true,
      message: 'Tutorial step started'
    });
  })
);

// Complete a tutorial step
router.post('/tutorial/steps/:stepId/complete',
  requireAuth,
  [
    param('stepId').isUUID(),
    body('timeSpentSeconds').optional().isInt({ min: 0 }),
    body('interactionData').optional().isObject()
  ],
  validateRequest,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { stepId } = req.params;
    const { timeSpentSeconds = 0 } = req.body;

    await onboardingService.completeTutorialStep(req.user!.id, stepId, timeSpentSeconds);

    res.json({
      success: true,
      message: 'Tutorial step completed'
    });
  })
);

// Mark first PRD as created (called internally when user creates first PRD)
router.post('/milestone/first-prd',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    await onboardingService.markFirstPRDCreated(req.user!.id);

    res.json({
      success: true,
      message: 'First PRD milestone marked'
    });
  })
);

// Mark team invitation as sent (called internally when user sends invitation)
router.post('/milestone/team-invitation',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    await onboardingService.markTeamInvitationSent(req.user!.id);

    res.json({
      success: true,
      message: 'Team invitation milestone marked'
    });
  })
);

// Get industry classifications
router.get('/classifications/industries',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const industries = await onboardingService.getIndustryClassifications();

    res.json({
      success: true,
      data: industries
    });
  })
);

// Get company type classifications
router.get('/classifications/company-types',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const companyTypes = await onboardingService.getCompanyTypeClassifications();

    res.json({
      success: true,
      data: companyTypes
    });
  })
);

// Rate a template
router.post('/templates/:templateId/rate',
  requireAuth,
  [
    param('templateId').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('review').optional().isLength({ min: 1, max: 1000 })
  ],
  validateRequest,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { templateId } = req.params;
    const { rating, review } = req.body;

    await onboardingService.rateTemplate(req.user!.id, templateId, rating, review);

    res.json({
      success: true,
      message: 'Template rated successfully'
    });
  })
);

// Get onboarding analytics (admin only)
router.get('/analytics',
  requireAuth,
  [
    query('timeRange').optional().isIn(['7d', '30d', '90d'])
  ],
  validateRequest,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    // TODO: Add admin role check
    const timeRange = req.query.timeRange as string || '30d';
    const analytics = await onboardingService.getOnboardingAnalytics(timeRange);

    res.json({
      success: true,
      data: analytics
    });
  })
);

// Skip onboarding (for experienced users)
router.post('/skip',
  requireAuth,
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    // Mark most milestones as completed but not tutorial
    await onboardingService.updateUserProfile(req.user!.id, {
      experienceLevel: 'expert'
    });

    res.json({
      success: true,
      message: 'Onboarding skipped'
    });
  })
);

export default router;