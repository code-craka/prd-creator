import api from './api';
import { AIGenerationRequest, AIGenerationResponse } from '../hooks/useAI';

class AIService {
  async generatePRD(request: AIGenerationRequest) {
    const response = await api.post('/ai/generate-prd', request);
    return response.data;
  }

  async generateSuggestions(prdId: string, section: string, content: string, context?: string) {
    const response = await api.post('/ai/suggestions', {
      prdId,
      section,
      content,
      context,
    });
    return response.data;
  }

  async improveSection(prdId: string, section: string, content: string, feedback: string) {
    const response = await api.post('/ai/improve-section', {
      prdId,
      section,
      content,
      feedback,
    });
    return response.data;
  }

  async createPRDFromAI(data: {
    title: string;
    aiResponse: AIGenerationResponse;
    teamId?: string;
    visibility?: 'private' | 'team' | 'public';
    templateId?: string;
  }) {
    const response = await api.post('/ai/create-prd', data);
    return response.data;
  }

  async validateKeys() {
    const response = await api.get('/ai/validate-keys');
    return response.data;
  }

  async getTemplates() {
    const response = await api.get('/ai/templates');
    return response.data;
  }
}

export const aiService = new AIService();