import { aiService } from '../../services/aiService';
import { testHelpers } from '../utils/testHelpers';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Mock external AI service calls
jest.mock('@anthropic-ai/sdk');
jest.mock('openai');

const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
const mockAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

describe.skip('AI Service', () => {
  beforeEach(async () => {
    await testHelpers.clearDatabase();
    jest.clearAllMocks();
    
    // Setup OpenAI mock
    const mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };
    mockOpenAI.mockImplementation(() => mockOpenAIInstance as any);
    
    // Setup Anthropic mock  
    const mockAnthropicInstance = {
      messages: {
        create: jest.fn()
      }
    };
    mockAnthropic.mockImplementation(() => mockAnthropicInstance as any);
  });

  afterAll(async () => {
    await testHelpers.cleanup();
  });

  describe('generatePRDContent', () => {
    it('should generate PRD content from prompt', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Test PRD',
              description: 'A test PRD description',
              sections: {
                overview: 'Test overview',
                requirements: 'Test requirements'
              }
            })
          }
        }]
      };

      // Mock the OpenAI response
      const mockInstance = new mockOpenAI();
      (mockInstance.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      const prompt = 'Create a PRD for a mobile app';
      const result = await aiService.generatePRD({ prompt, prdType: 'feature' });

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('sections');
    });

    it('should handle AI service errors gracefully', async () => {
      // Mock the OpenAI response to throw an error
      const mockInstance = new mockOpenAI();
      (mockInstance.chat.completions.create as jest.Mock).mockRejectedValue(new Error('AI service error'));

      const prompt = 'Create a PRD for a mobile app';

      await expect(aiService.generatePRD({ prompt, prdType: 'feature' })).rejects.toThrow('AI service error');
    });
  });

  describe('improvePRDSection', () => {
    it('should improve existing PRD section', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Improved section content with better details and structure.'
          }
        }]
      };

      const { openai } = require('../../config/ai');
      openai.chat.completions.create.mockResolvedValue(mockResponse);

      const sectionContent = 'Basic section content';
      const improvementType = 'clarity';
      const result = await aiService.improveSection(sectionContent, 'overview', improvementType);

      expect(result).toBe('Improved section content with better details and structure.');
      expect(openai.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining(sectionContent)
            })
          ])
        })
      );
    });
  });

  describe('generateRequirements', () => {
    it('should generate requirements from description', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              functional: [
                'User can create account',
                'User can login'
              ],
              nonFunctional: [
                'System should handle 1000 concurrent users',
                'Response time should be under 2 seconds'
              ]
            })
          }
        }]
      };

      const { openai } = require('../../config/ai');
      openai.chat.completions.create.mockResolvedValue(mockResponse);

      const description = 'A social media platform for sharing photos';
      const result = await aiService.generateSuggestions(description, 'requirements');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('analyzePRDCompleteness', () => {
    it('should analyze PRD completeness and provide suggestions', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              completenessScore: 75,
              missingElements: ['User personas', 'Success metrics'],
              suggestions: [
                'Add detailed user personas',
                'Define clear success metrics'
              ]
            })
          }
        }]
      };

      const { openai } = require('../../config/ai');
      openai.chat.completions.create.mockResolvedValue(mockResponse);

      const prdContent = {
        title: 'Test PRD',
        description: 'Test description',
        requirements: ['Req 1', 'Req 2']
      };

      const result = await aiService.generateSuggestions(JSON.stringify(prdContent), 'analysis');

      expect(result).toHaveProperty('completenessScore');
      expect(result).toHaveProperty('missingElements');
      expect(result).toHaveProperty('suggestions');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('generateUserStories', () => {
    it('should generate user stories from requirements', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify([
              {
                title: 'User Registration',
                story: 'As a new user, I want to create an account so that I can access the platform',
                acceptanceCriteria: [
                  'User can enter email and password',
                  'System validates email format',
                  'Account is created successfully'
                ]
              }
            ])
          }
        }]
      };

      const { openai } = require('../../config/ai');
      openai.chat.completions.create.mockResolvedValue(mockResponse);

      const requirements = ['User registration functionality'];
      const result = await aiService.generateSuggestions(requirements.join(', '), 'user-stories');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('story');
      expect(result[0]).toHaveProperty('acceptanceCriteria');
    });
  });
});