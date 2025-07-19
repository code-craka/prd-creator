import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';
import { 
  AnalyticsDashboardData, 
  TeamProductivityMetrics, 
  PRDTrends, 
  TemplateUsageStats, 
  UserEngagementInsights,
  TimeRange,
  AnalyticsEvent
} from '../types/analytics';

interface UseAnalyticsReturn {
  // Data
  dashboardData: AnalyticsDashboardData | null;
  teamProductivity: TeamProductivityMetrics | null;
  prdTrends: PRDTrends | null;
  templateUsage: TemplateUsageStats[] | null;
  userEngagement: UserEngagementInsights | null;
  
  // Loading states
  loading: boolean;
  loadingDashboard: boolean;
  loadingProductivity: boolean;
  loadingTrends: boolean;
  loadingTemplates: boolean;
  loadingEngagement: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  loadDashboardData: (timeRange?: TimeRange, teamId?: string) => Promise<void>;
  loadTeamProductivity: (timeRange?: TimeRange) => Promise<void>;
  loadPRDTrends: (timeRange?: TimeRange, teamId?: string) => Promise<void>;
  loadTemplateUsage: (teamId?: string) => Promise<void>;
  loadUserEngagement: (teamId?: string) => Promise<void>;
  trackEvent: (event: AnalyticsEvent) => Promise<void>;
  
  // Convenience tracking methods
  trackPRDCreated: (prdId: string, eventData?: Record<string, any>) => Promise<void>;
  trackPRDViewed: (prdId: string, eventData?: Record<string, any>) => Promise<void>;
  trackPRDEdited: (prdId: string, eventData?: Record<string, any>) => Promise<void>;
  trackCommentAdded: (prdId: string, eventData?: Record<string, any>) => Promise<void>;
  trackTemplateUsed: (templateName: string, templateType: string, eventData?: Record<string, any>) => Promise<void>;
  trackAIGeneration: (prdId: string, provider: string, eventData?: Record<string, any>) => Promise<void>;
  trackCollaborationStarted: (prdId: string, eventData?: Record<string, any>) => Promise<void>;
  
  // Refresh
  refresh: () => Promise<void>;
}

export const useAnalytics = (autoLoad: boolean = true): UseAnalyticsReturn => {
  // Data states
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [teamProductivity, setTeamProductivity] = useState<TeamProductivityMetrics | null>(null);
  const [prdTrends, setPrdTrends] = useState<PRDTrends | null>(null);
  const [templateUsage, setTemplateUsage] = useState<TemplateUsageStats[] | null>(null);
  const [userEngagement, setUserEngagement] = useState<UserEngagementInsights | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingProductivity, setLoadingProductivity] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingEngagement, setLoadingEngagement] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  const loadDashboardData = useCallback(async (timeRange: TimeRange = '30d', teamId?: string) => {
    try {
      setLoadingDashboard(true);
      setError(null);
      const data = await analyticsService.getDashboardData(timeRange, teamId);
      setDashboardData(data);
      
      // Also set individual data pieces
      setTeamProductivity(data.teamProductivity);
      setPrdTrends(data.prdTrends);
      setTemplateUsage(data.templateUsage);
      setUserEngagement(data.userEngagement);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  // Load team productivity metrics
  const loadTeamProductivity = useCallback(async (timeRange: TimeRange = '30d') => {
    try {
      setLoadingProductivity(true);
      setError(null);
      const data = await analyticsService.getTeamProductivityMetrics(timeRange);
      setTeamProductivity(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load team productivity data';
      setError(errorMessage);
      console.error('Failed to load team productivity:', err);
    } finally {
      setLoadingProductivity(false);
    }
  }, []);

  // Load PRD trends
  const loadPRDTrends = useCallback(async (timeRange: TimeRange = '30d', teamId?: string) => {
    try {
      setLoadingTrends(true);
      setError(null);
      const data = await analyticsService.getPRDTrends(timeRange, teamId);
      setPrdTrends(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load PRD trends';
      setError(errorMessage);
      console.error('Failed to load PRD trends:', err);
    } finally {
      setLoadingTrends(false);
    }
  }, []);

  // Load template usage
  const loadTemplateUsage = useCallback(async (teamId?: string) => {
    try {
      setLoadingTemplates(true);
      setError(null);
      const data = await analyticsService.getTemplateUsageStats(teamId);
      setTemplateUsage(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load template usage';
      setError(errorMessage);
      console.error('Failed to load template usage:', err);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  // Load user engagement
  const loadUserEngagement = useCallback(async (teamId?: string) => {
    try {
      setLoadingEngagement(true);
      setError(null);
      const data = await analyticsService.getUserEngagementInsights(teamId);
      setUserEngagement(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user engagement';
      setError(errorMessage);
      console.error('Failed to load user engagement:', err);
    } finally {
      setLoadingEngagement(false);
    }
  }, []);

  // Track analytics event
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    try {
      await analyticsService.trackEvent(event);
    } catch (err) {
      console.error('Failed to track analytics event:', err);
      // Don't throw error to avoid disrupting user experience
    }
  }, []);

  // Convenience tracking methods
  const trackPRDCreated = useCallback((prdId: string, eventData?: Record<string, any>) => {
    return analyticsService.trackPRDCreated(prdId, eventData);
  }, []);

  const trackPRDViewed = useCallback((prdId: string, eventData?: Record<string, any>) => {
    return analyticsService.trackPRDViewed(prdId, eventData);
  }, []);

  const trackPRDEdited = useCallback((prdId: string, eventData?: Record<string, any>) => {
    return analyticsService.trackPRDEdited(prdId, eventData);
  }, []);

  const trackCommentAdded = useCallback((prdId: string, eventData?: Record<string, any>) => {
    return analyticsService.trackCommentAdded(prdId, eventData);
  }, []);

  const trackTemplateUsed = useCallback((templateName: string, templateType: string, eventData?: Record<string, any>) => {
    return analyticsService.trackTemplateUsed(templateName, templateType, eventData);
  }, []);

  const trackAIGeneration = useCallback((prdId: string, provider: string, eventData?: Record<string, any>) => {
    return analyticsService.trackAIGeneration(prdId, provider, eventData);
  }, []);

  const trackCollaborationStarted = useCallback((prdId: string, eventData?: Record<string, any>) => {
    return analyticsService.trackCollaborationStarted(prdId, eventData);
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await loadDashboardData();
    } finally {
      setLoading(false);
    }
  }, [loadDashboardData]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadDashboardData();
    }
  }, [autoLoad, loadDashboardData]);

  // Update overall loading state
  useEffect(() => {
    setLoading(
      loadingDashboard || 
      loadingProductivity || 
      loadingTrends || 
      loadingTemplates || 
      loadingEngagement
    );
  }, [loadingDashboard, loadingProductivity, loadingTrends, loadingTemplates, loadingEngagement]);

  return {
    // Data
    dashboardData,
    teamProductivity,
    prdTrends,
    templateUsage,
    userEngagement,
    
    // Loading states
    loading,
    loadingDashboard,
    loadingProductivity,
    loadingTrends,
    loadingTemplates,
    loadingEngagement,
    
    // Error
    error,
    
    // Actions
    loadDashboardData,
    loadTeamProductivity,
    loadPRDTrends,
    loadTemplateUsage,
    loadUserEngagement,
    trackEvent,
    
    // Convenience tracking
    trackPRDCreated,
    trackPRDViewed,
    trackPRDEdited,
    trackCommentAdded,
    trackTemplateUsed,
    trackAIGeneration,
    trackCollaborationStarted,
    
    // Refresh
    refresh,
  };
};