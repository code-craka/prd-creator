import express, { Router } from 'express';
import { requireAuth, BackendAuthenticatedRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';
import { prdService } from '../services/prdService';
import { validateBody } from '../middleware/validation';
import { validationSchemas } from '../schemas/validationSchemas';
import { asyncWrapper } from '../utils/helpers';

const router = Router();

// Generate PRD using AI
router.post('/generate-prd',
  requireAuth,
  validateBody(validationSchemas.ai.generatePRD),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const aiResponse = await aiService.generatePRD(req.body, req.body.provider);
    
    res.json({
      success: true,
      data: aiResponse,
      message: 'PRD generated successfully',
    });
  })
);

// Generate suggestions for a section
router.post('/suggestions',
  requireAuth,
  validateBody(validationSchemas.ai.generateSuggestions),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { prdId, section, content, context } = req.body;
    
    // Verify user has access to the PRD
    await prdService.getPRD(prdId, req.user.id);
    
    const suggestions = await aiService.generateSuggestions(content, section, context);
    
    res.json({
      success: true,
      data: { suggestions },
      message: 'Suggestions generated successfully',
    });
  })
);

// Improve a section based on feedback
router.post('/improve-section',
  requireAuth,
  validateBody(validationSchemas.ai.improveSection),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { prdId, section, content, feedback } = req.body;
    
    // Verify user has access to the PRD
    await prdService.getPRD(prdId, req.user.id);
    
    const improvedContent = await aiService.improveSection(content, section, feedback);
    
    res.json({
      success: true,
      data: { improvedContent },
      message: 'Section improved successfully',
    });
  })
);

// Create PRD from AI-generated content
router.post('/create-prd',
  requireAuth,
  validateBody(validationSchemas.ai.createFromAI),
  asyncWrapper(async (req: BackendAuthenticatedRequest, res: express.Response) => {
    const { title, aiResponse, teamId, visibility, templateId } = req.body;
    
    // Create PRD with AI-generated content
    const prd = await prdService.createPRD(req.user.id, {
      title,
      content: aiResponse.content,
      teamId,
      visibility,
      template_id: templateId,
      metadata: {
        aiGenerated: true,
        aiMetadata: aiResponse.metadata,
        aiSections: aiResponse.sections,
        aiSuggestions: aiResponse.suggestions,
        generatedAt: new Date().toISOString(),
      },
    });
    
    res.status(201).json({
      success: true,
      data: { prd },
      message: 'PRD created from AI content successfully',
    });
  })
);

// Validate AI API keys
router.get('/validate-keys',
  requireAuth,
  asyncWrapper(async (_req: BackendAuthenticatedRequest, res: express.Response) => {
    const validation = await aiService.validateAPIKeys();
    
    res.json({
      success: true,
      data: validation,
      message: 'API keys validated',
    });
  })
);

// Get AI generation templates and options
router.get('/templates',
  requireAuth,
  asyncWrapper(async (_req: BackendAuthenticatedRequest, res: express.Response) => {
    const templates = {
      prdTypes: [
        {
          value: 'feature',
          label: 'New Feature',
          description: 'Add functionality to an existing product',
          icon: 'Plus',
        },
        {
          value: 'product',
          label: 'New Product',
          description: 'Create a completely new product',
          icon: 'Package',
        },
        {
          value: 'api',
          label: 'API/Integration',
          description: 'Technical API or system integration',
          icon: 'Code',
        },
        {
          value: 'mobile',
          label: 'Mobile App',
          description: 'Mobile application development',
          icon: 'Smartphone',
        },
        {
          value: 'web',
          label: 'Web Application',
          description: 'Web-based application or platform',
          icon: 'Globe',
        },
        {
          value: 'enhancement',
          label: 'Enhancement',
          description: 'Improve existing functionality',
          icon: 'Zap',
        },
        {
          value: 'custom',
          label: 'Custom',
          description: 'Custom solution with specific requirements',
          icon: 'Settings',
        },
      ],
      styles: [
        {
          value: 'technical',
          label: 'Technical',
          description: 'Focus on technical specifications and architecture',
        },
        {
          value: 'business',
          label: 'Business',
          description: 'Emphasize business value and market analysis',
        },
        {
          value: 'executive',
          label: 'Executive',
          description: 'High-level strategic overview with clear metrics',
        },
        {
          value: 'detailed',
          label: 'Detailed',
          description: 'Comprehensive details across all sections',
        },
        {
          value: 'concise',
          label: 'Concise',
          description: 'Brief but complete, focusing on essentials',
        },
      ],
      providers: [
        {
          name: 'anthropic',
          label: 'Claude (Anthropic)',
          models: [
            {
              value: 'claude-3-5-sonnet-20241022',
              label: 'Claude 3.5 Sonnet',
              description: 'Balanced performance and quality',
              maxTokens: 4000,
              recommended: true,
            },
            {
              value: 'claude-3-5-haiku-20241022',
              label: 'Claude 3.5 Haiku',
              description: 'Fast and efficient',
              maxTokens: 4000,
              recommended: false,
            },
          ],
        },
        {
          name: 'openai',
          label: 'OpenAI',
          models: [
            {
              value: 'gpt-4o',
              label: 'GPT-4o',
              description: 'Most capable model',
              maxTokens: 4000,
              recommended: true,
            },
            {
              value: 'gpt-4o-mini',
              label: 'GPT-4o Mini',
              description: 'Fast and cost-effective',
              maxTokens: 4000,
              recommended: false,
            },
          ],
        },
      ],
      defaultSections: [
        '1. Executive Summary',
        '2. Problem Statement',
        '3. Goals and Objectives',
        '4. Target Users',
        '5. User Stories',
        '6. Functional Requirements',
        '7. Non-Functional Requirements',
        '8. Technical Specifications',
        '9. UI/UX Considerations',
        '10. Success Metrics',
        '11. Timeline and Milestones',
        '12. Risks and Mitigation',
        '13. Dependencies',
        '14. Appendix',
      ],
    };
    
    res.json({
      success: true,
      data: templates,
      message: 'AI templates retrieved successfully',
    });
  })
);

export default router;