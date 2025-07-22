import axios from 'axios';
import { 
  AnalyticsDashboardData, 
  TeamProductivityMetrics, 
  PRDTrends, 
  TemplateUsageStats, 
  UserEngagementInsights,
  TimeRange,
  AnalyticsEvent,
  PRDEventData,
  TemplateEventData,
  AIEventData,
  CollaborationEventData,
  CommentEventData
} from '../types/analytics';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class AnalyticsService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('token');
    const teamId = localStorage.getItem('currentTeamId');
    
    return {
      'Authorization': `Bearer ${token}`,
      'X-Team-ID': teamId || '',
      'Content-Type': 'application/json',
    };
  }

  // Track analytics event
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/api/analytics/events`, event, {
        headers: AnalyticsService.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      // Don't throw error to avoid disrupting user experience
    }
  }

  // Get team productivity metrics
  async getTeamProductivityMetrics(timeRange: TimeRange = '30d'): Promise<TeamProductivityMetrics> {
    const response = await axios.get(`${API_BASE_URL}/api/analytics/team-productivity`, {
      headers: AnalyticsService.getAuthHeaders(),
      params: { timeRange },
    });
    return response.data.data;
  }

  // Get PRD creation trends
  async getPRDTrends(timeRange: TimeRange = '30d', teamId?: string): Promise<PRDTrends> {
    const response = await axios.get(`${API_BASE_URL}/api/analytics/prd-trends`, {
      headers: AnalyticsService.getAuthHeaders(),
      params: { timeRange, teamId },
    });
    return response.data.data;
  }

  // Get template usage statistics
  async getTemplateUsageStats(teamId?: string): Promise<TemplateUsageStats[]> {
    const response = await axios.get(`${API_BASE_URL}/api/analytics/template-usage`, {
      headers: AnalyticsService.getAuthHeaders(),
      params: { teamId },
    });
    return response.data.data;
  }

  // Get user engagement insights
  async getUserEngagementInsights(teamId?: string): Promise<UserEngagementInsights> {
    const response = await axios.get(`${API_BASE_URL}/api/analytics/user-engagement`, {
      headers: AnalyticsService.getAuthHeaders(),
      params: { teamId },
    });
    return response.data.data;
  }

  // Get complete analytics dashboard data
  async getDashboardData(timeRange: TimeRange = '30d', teamId?: string): Promise<AnalyticsDashboardData> {
    const response = await axios.get(`${API_BASE_URL}/api/analytics/dashboard`, {
      headers: AnalyticsService.getAuthHeaders(),
      params: { timeRange, teamId },
    });
    return response.data.data;
  }

  // Get global analytics overview (admin)
  async getGlobalOverview(timeRange: TimeRange = '30d') {
    const response = await axios.get(`${API_BASE_URL}/api/analytics/overview`, {
      headers: AnalyticsService.getAuthHeaders(),
      params: { timeRange },
    });
    return response.data.data;
  }

  // Helper methods for common events
  trackPRDCreated(prdId: string, eventData?: PRDEventData) {
    return this.trackEvent({
      eventType: 'prd_created',
      eventCategory: 'prd',
      prdId,
      eventData,
    });
  }

  trackPRDViewed(prdId: string, eventData?: PRDEventData) {
    return this.trackEvent({
      eventType: 'prd_viewed',
      eventCategory: 'prd',
      prdId,
      eventData,
    });
  }

  trackPRDEdited(prdId: string, eventData?: PRDEventData) {
    return this.trackEvent({
      eventType: 'prd_edited',
      eventCategory: 'prd',
      prdId,
      eventData,
    });
  }

  trackCommentAdded(prdId: string, eventData?: CommentEventData) {
    return this.trackEvent({
      eventType: 'comment_added',
      eventCategory: 'collaboration',
      prdId,
      eventData,
    });
  }

  trackTemplateUsed(templateName: string, templateType: string, eventData?: TemplateEventData) {
    return this.trackEvent({
      eventType: 'template_used',
      eventCategory: 'template',
      eventData: {
        templateName,
        templateType,
        ...eventData,
      },
    });
  }

  trackAIGeneration(prdId: string, provider: string, eventData?: AIEventData) {
    return this.trackEvent({
      eventType: 'ai_generation_used',
      eventCategory: 'ai',
      prdId,
      eventData: {
        provider,
        ...eventData,
      },
    });
  }

  trackCollaborationStarted(prdId: string, eventData?: CollaborationEventData) {
    return this.trackEvent({
      eventType: 'collaboration_started',
      eventCategory: 'collaboration',
      prdId,
      eventData,
    });
  }

  trackUserLogin(eventData?: Record<string, string | number | boolean>) {
    return this.trackEvent({
      eventType: 'user_login',
      eventCategory: 'user',
      eventData,
    });
  }

  trackTeamSwitched(teamId: string, eventData?: Record<string, string | number | boolean>) {
    return this.trackEvent({
      eventType: 'team_switched',
      eventCategory: 'team',
      eventData: {
        teamId,
        ...eventData,
      },
    });
  }
}

export const analyticsService = new AnalyticsService();