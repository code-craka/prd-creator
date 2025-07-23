// Analytics and metrics related types and interfaces

// Basic analytics event structure
export interface AnalyticsEvent {
  userId?: string;
  teamId?: string;
  prdId?: string;
  eventType: string;
  eventCategory: string;
  eventData?: Record<string, unknown>;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Team productivity metrics
export interface TeamProductivityMetrics {
  teamId: string;
  teamName: string;
  totalPrds: number;
  prdsThisWeek: number;
  prdsThisMonth: number;
  activeUsers: number;
  totalComments: number;
  avgCompletionTime: number;
  collaborationSessions: number;
  topContributors: Array<{
    userId: string;
    userName: string;
    prdsCreated: number;
    commentsCount: number;
  }>;
}

// PRD trends and usage patterns
export interface PRDTrends {
  daily: Array<{
    date: string;
    prdsCreated: number;
    prdsEdited: number;
    activeUsers: number;
  }>;
  weekly: Array<{
    week: string;
    prdsCreated: number;
    prdsEdited: number;
    activeUsers: number;
  }>;
  monthly: Array<{
    month: string;
    prdsCreated: number;
    prdsEdited: number;
    activeUsers: number;
  }>;
}

// Template usage statistics
export interface TemplateUsageStats {
  templateName: string;
  templateType: string;
  usageCount: number;
  usageGrowth: number;
  popularityRank: number;
  teamUsage: Array<{
    teamId: string;
    teamName: string;
    usageCount: number;
  }>;
}

// User engagement metrics
export interface UserEngagementInsights {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  averageSessionTime: number;
  userRetention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  topUsers: Array<{
    userId: string;
    userName: string;
    timeSpent: number;
    prdsCreated: number;
    lastActive: Date | string;
  }>;
}

// Dashboard data aggregation
export interface AnalyticsDashboardData {
  teamProductivity: TeamProductivityMetrics;
  prdTrends: PRDTrends;
  templateUsage: TemplateUsageStats[];
  userEngagement: UserEngagementInsights;
  generatedAt: string;
}

// Event data base interface
export interface EventData {
  [key: string]: string | number | boolean | string[] | null | undefined;
}

// Specific event data interfaces
export interface PRDEventData extends EventData {
  title?: string;
  content_length?: number;
  visibility?: 'private' | 'team' | 'public';
  team_id?: string;
  template_id?: string;
  word_count?: number;
  section_count?: number;
}

export interface TemplateEventData extends EventData {
  templateName: string;
  templateType: string;
  industry?: string;
  complexity?: string;
  questions_count?: number;
  sections_count?: number;
}

export interface AIEventData extends EventData {
  provider: string;
  model?: string;
  prompt_length?: number;
  response_length?: number;
  generation_time_ms?: number;
  token_count?: number;
}

export interface CollaborationEventData extends EventData {
  participant_count?: number;
  session_duration_ms?: number;
  operation_type?: 'edit' | 'comment' | 'cursor_move' | 'selection';
  section?: string;
}

export interface CommentEventData extends EventData {
  comment_length?: number;
  section?: string;
  parent_comment_id?: string;
  is_reply?: boolean;
}

// Time range options for analytics queries
export type TimeRange = '7d' | '30d' | '90d';

// Additional analytics interfaces for future extensibility
export interface MetricsSummary {
  period: TimeRange;
  totalEvents: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  generatedAt: Date | string;
}

export interface AnalyticsFilter {
  teamId?: string;
  userId?: string;
  eventType?: string;
  eventCategory?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  limit?: number;
  offset?: number;
}
