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
    lastActive: Date;
  }>;
}

export interface AnalyticsDashboardData {
  teamProductivity: TeamProductivityMetrics;
  prdTrends: PRDTrends;
  templateUsage: TemplateUsageStats[];
  userEngagement: UserEngagementInsights;
  generatedAt: string;
}

export interface AnalyticsEvent {
  eventType: string;
  eventCategory: string;
  eventData?: Record<string, any>;
  prdId?: string;
  sessionId?: string;
}

export type TimeRange = '7d' | '30d' | '90d';