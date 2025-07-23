import { db } from '../config/database';

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

export class AnalyticsService {
  // Track analytics events
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await db('analytics_events').insert({
        user_id: event.userId,
        team_id: event.teamId,
        prd_id: event.prdId,
        event_type: event.eventType,
        event_category: event.eventCategory,
        event_data: event.eventData || {},
        session_id: event.sessionId,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
      });

      // Update relevant analytics summaries
      await this.updateAnalyticsSummaries(event);
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  // Get team productivity metrics
  async getTeamProductivityMetrics(teamId: string, timeRange: string = '30d'): Promise<TeamProductivityMetrics> {
    const team = await db('teams').where('id', teamId).first();
    if (!team) {
      throw new Error('Team not found');
    }

    const dateRange = this.getDateRange(timeRange);
    
    // Get basic PRD metrics
    const prdMetrics = await db('prds')
      .where('team_id', teamId)
      .select(
        db.raw('COUNT(*) as total_prds'),
        db.raw(`COUNT(CASE WHEN created_at >= '${dateRange.weekAgo}' THEN 1 END) as prds_this_week`),
        db.raw(`COUNT(CASE WHEN created_at >= '${dateRange.monthAgo}' THEN 1 END) as prds_this_month`)
      )
      .first();

    // Get active users count
    const activeUsers = await db('user_activity')
      .where('team_id', teamId)
      .where('date', '>=', dateRange.weekAgo)
      .countDistinct('user_id as count')
      .first();

    // Get total comments
    const commentMetrics = await db('prd_comments')
      .join('prds', 'prd_comments.prd_id', 'prds.id')
      .where('prds.team_id', teamId)
      .count('prd_comments.id as total_comments')
      .first();

    // Get average completion time
    const avgCompletionTime = await db('prd_analytics')
      .join('prds', 'prd_analytics.prd_id', 'prds.id')
      .where('prds.team_id', teamId)
      .avg('prd_analytics.avg_completion_time as avg_time')
      .first();

    // Get collaboration sessions
    const collaborationSessions = await db('team_analytics')
      .where('team_id', teamId)
      .where('date', '>=', dateRange.monthAgo)
      .sum('collaboration_sessions as total_sessions')
      .first();

    // Get top contributors
    const topContributors = await db('user_activity')
      .join('users', 'user_activity.user_id', 'users.id')
      .where('user_activity.team_id', teamId)
      .where('user_activity.date', '>=', dateRange.monthAgo)
      .select(
        'users.id as userId',
        'users.name as userName',
        db.raw('SUM(user_activity.prds_created) as prds_created'),
        db.raw('SUM(user_activity.comments_made) as comments_count')
      )
      .groupBy('users.id', 'users.name')
      .orderBy('prds_created', 'desc')
      .limit(5);

    return {
      teamId,
      teamName: team.name,
      totalPrds: parseInt(prdMetrics.total_prds) || 0,
      prdsThisWeek: parseInt(prdMetrics.prds_this_week) || 0,
      prdsThisMonth: parseInt(prdMetrics.prds_this_month) || 0,
      activeUsers: parseInt(String(activeUsers?.count || 0)) || 0,
      totalComments: parseInt(String(commentMetrics?.total_comments || 0)) || 0,
      avgCompletionTime: parseFloat(String(avgCompletionTime?.avg_time || 0)) || 0,
      collaborationSessions: parseInt(String(collaborationSessions?.total_sessions || 0)) || 0,
      topContributors: topContributors.map(contributor => ({
        userId: contributor.userId,
        userName: contributor.userName,
        prdsCreated: parseInt(contributor.prds_created) || 0,
        commentsCount: parseInt(contributor.comments_count) || 0,
      })),
    };
  }

  // Get PRD creation trends
  async getPRDTrends(teamId?: string, timeRange: string = '30d'): Promise<PRDTrends> {
    const dateRange = this.getDateRange(timeRange);
    
    const baseQuery = teamId 
      ? db('analytics_events').where('team_id', teamId)
      : db('analytics_events');

    // Daily trends
    const dailyTrends = await baseQuery
      .clone()
      .where('event_type', 'IN', ['prd_created', 'prd_edited'])
      .where('created_at', '>=', dateRange.start)
      .select(
        db.raw('DATE(created_at) as date'),
        db.raw(`COUNT(CASE WHEN event_type = 'prd_created' THEN 1 END) as prds_created`),
        db.raw(`COUNT(CASE WHEN event_type = 'prd_edited' THEN 1 END) as prds_edited`),
        db.raw('COUNT(DISTINCT user_id) as active_users')
      )
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date');

    // Weekly trends
    const weeklyTrends = await baseQuery
      .clone()
      .where('event_type', 'IN', ['prd_created', 'prd_edited'])
      .where('created_at', '>=', dateRange.monthAgo)
      .select(
        db.raw('DATE_TRUNC(\'week\', created_at) as week'),
        db.raw(`COUNT(CASE WHEN event_type = 'prd_created' THEN 1 END) as prds_created`),
        db.raw(`COUNT(CASE WHEN event_type = 'prd_edited' THEN 1 END) as prds_edited`),
        db.raw('COUNT(DISTINCT user_id) as active_users')
      )
      .groupBy(db.raw('DATE_TRUNC(\'week\', created_at)'))
      .orderBy('week');

    // Monthly trends
    const monthlyTrends = await baseQuery
      .clone()
      .where('event_type', 'IN', ['prd_created', 'prd_edited'])
      .where('created_at', '>=', dateRange.yearAgo)
      .select(
        db.raw('DATE_TRUNC(\'month\', created_at) as month'),
        db.raw(`COUNT(CASE WHEN event_type = 'prd_created' THEN 1 END) as prds_created`),
        db.raw(`COUNT(CASE WHEN event_type = 'prd_edited' THEN 1 END) as prds_edited`),
        db.raw('COUNT(DISTINCT user_id) as active_users')
      )
      .groupBy(db.raw('DATE_TRUNC(\'month\', created_at)'))
      .orderBy('month');

    return {
      daily: dailyTrends.map((trend: any) => ({
        date: trend.date,
        prdsCreated: parseInt(trend.prds_created) || 0,
        prdsEdited: parseInt(trend.prds_edited) || 0,
        activeUsers: parseInt(trend.active_users) || 0,
      })),
      weekly: weeklyTrends.map((trend: any) => ({
        week: trend.week,
        prdsCreated: parseInt(trend.prds_created) || 0,
        prdsEdited: parseInt(trend.prds_edited) || 0,
        activeUsers: parseInt(trend.active_users) || 0,
      })),
      monthly: monthlyTrends.map((trend: any) => ({
        month: trend.month,
        prdsCreated: parseInt(trend.prds_created) || 0,
        prdsEdited: parseInt(trend.prds_edited) || 0,
        activeUsers: parseInt(trend.active_users) || 0,
      })),
    };
  }

  // Get template usage statistics
  async getTemplateUsageStats(teamId?: string): Promise<TemplateUsageStats[]> {
    const dateRange = this.getDateRange('30d');
    
    const baseQuery = teamId 
      ? db('template_analytics').where('team_id', teamId)
      : db('template_analytics');

    const templateStats = await baseQuery
      .clone()
      .where('date', '>=', dateRange.monthAgo)
      .select(
        'template_name',
        'template_type',
        db.raw('SUM(usage_count) as usage_count')
      )
      .groupBy('template_name', 'template_type')
      .orderBy('usage_count', 'desc');

    // Get previous month usage for growth calculation
    const previousMonthStats = await baseQuery
      .clone()
      .where('date', '>=', dateRange.twoMonthsAgo)
      .where('date', '<', dateRange.monthAgo)
      .select(
        'template_name',
        db.raw('SUM(usage_count) as prev_usage_count')
      )
      .groupBy('template_name');

    const prevUsageMap = new Map(
      previousMonthStats.map(stat => [stat.template_name, parseInt(stat.prev_usage_count) || 0])
    );

    // Get team usage breakdown for each template
    const teamUsagePromises = templateStats.map(async (template) => {
      const teamUsage = await db('template_analytics')
        .join('teams', 'template_analytics.team_id', 'teams.id')
        .where('template_analytics.template_name', template.template_name)
        .where('template_analytics.date', '>=', dateRange.monthAgo)
        .select(
          'teams.id as teamId',
          'teams.name as teamName',
          db.raw('SUM(template_analytics.usage_count) as usage_count')
        )
        .groupBy('teams.id', 'teams.name')
        .orderBy('usage_count', 'desc')
        .limit(5);

      return {
        templateName: template.template_name,
        teamUsage: teamUsage.map(usage => ({
          teamId: usage.teamId,
          teamName: usage.teamName,
          usageCount: parseInt(usage.usage_count) || 0,
        })),
      };
    });

    const teamUsageResults = await Promise.all(teamUsagePromises);
    const teamUsageMap = new Map(
      teamUsageResults.map(result => [result.templateName, result.teamUsage])
    );

    return templateStats.map((template, index) => {
      const currentUsage = parseInt(template.usage_count) || 0;
      const previousUsage = prevUsageMap.get(template.template_name) || 0;
      const usageGrowth = previousUsage > 0 
        ? ((currentUsage - previousUsage) / previousUsage) * 100 
        : 0;

      return {
        templateName: template.template_name,
        templateType: template.template_type,
        usageCount: currentUsage,
        usageGrowth,
        popularityRank: index + 1,
        teamUsage: teamUsageMap.get(template.template_name) || [],
      };
    });
  }

  // Get user engagement insights
  async getUserEngagementInsights(teamId?: string): Promise<UserEngagementInsights> {
    const dateRange = this.getDateRange('30d');
    
    const baseQuery = teamId 
      ? db('user_activity').where('team_id', teamId)
      : db('user_activity');

    // Total and active users
    const userCounts = await db('users')
      .leftJoin('user_activity', function() {
        this.on('users.id', 'user_activity.user_id')
          .andOn('user_activity.date', '>=', db.raw('?', [dateRange.weekAgo]));
        if (teamId) {
          this.andOn('user_activity.team_id', '=', db.raw('?', [teamId]));
        }
      })
      .select(
        db.raw('COUNT(DISTINCT users.id) as total_users'),
        db.raw('COUNT(DISTINCT user_activity.user_id) as active_users')
      )
      .first();

    // New users (users created in the last 30 days)
    const newUsers = await db('users')
      .where('created_at', '>=', dateRange.monthAgo)
      .count('id as count')
      .first();

    // Average session time
    const avgSessionTime = await baseQuery
      .clone()
      .where('date', '>=', dateRange.monthAgo)
      .avg('time_spent_minutes as avg_time')
      .first();

    // User retention rates
    const dailyRetention = await this.calculateRetentionRate(teamId, 1);
    const weeklyRetention = await this.calculateRetentionRate(teamId, 7);
    const monthlyRetention = await this.calculateRetentionRate(teamId, 30);

    // Top users by activity
    const topUsers = await baseQuery
      .clone()
      .join('users', 'user_activity.user_id', 'users.id')
      .where('user_activity.date', '>=', dateRange.monthAgo)
      .select(
        'users.id as userId',
        'users.name as userName',
        db.raw('SUM(user_activity.time_spent_minutes) as time_spent'),
        db.raw('SUM(user_activity.prds_created) as prds_created'),
        db.raw('MAX(user_activity.last_active_at) as last_active')
      )
      .groupBy('users.id', 'users.name')
      .orderBy('time_spent', 'desc')
      .limit(10);

    return {
      totalUsers: parseInt(userCounts.total_users) || 0,
      activeUsers: parseInt(userCounts.active_users) || 0,
      newUsers: parseInt(String(newUsers?.count || 0)) || 0,
      averageSessionTime: parseFloat(String(avgSessionTime?.avg_time || 0)) || 0,
      userRetention: {
        daily: dailyRetention,
        weekly: weeklyRetention,
        monthly: monthlyRetention,
      },
      topUsers: topUsers.map(user => ({
        userId: user.userId,
        userName: user.userName,
        timeSpent: parseFloat(user.time_spent) || 0,
        prdsCreated: parseInt(user.prds_created) || 0,
        lastActive: new Date(user.last_active),
      })),
    };
  }

  // Private helper methods
  private async updateAnalyticsSummaries(event: AnalyticsEvent): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    try {
      // Update user activity
      if (event.userId) {
        await this.updateUserActivity(event.userId, event.teamId, today, event.eventType);
      }

      // Update team analytics
      if (event.teamId) {
        await this.updateTeamAnalytics(event.teamId, today, event.eventType);
      }

      // Update PRD analytics
      if (event.prdId) {
        await this.updatePRDAnalytics(event.prdId, event.eventType);
      }

      // Update template analytics
      if (event.eventType === 'template_used' && event.eventData?.templateName) {
        await this.updateTemplateAnalytics(
          event.eventData.templateName as string,
          event.eventData.templateType as string,
          event.teamId,
          today
        );
      }
    } catch (error) {
      console.error('Error updating analytics summaries:', error);
    }
  }

  private async updateUserActivity(userId: string, teamId: string | undefined, date: string, eventType: string): Promise<void> {
    const updates: any = { last_active_at: new Date() };
    
    switch (eventType) {
      case 'prd_created':
        updates.prds_created = db.raw('prds_created + 1');
        break;
      case 'prd_viewed':
        updates.prds_viewed = db.raw('prds_viewed + 1');
        break;
      case 'prd_edited':
        updates.prds_edited = db.raw('prds_edited + 1');
        break;
      case 'comment_added':
        updates.comments_made = db.raw('comments_made + 1');
        break;
      case 'user_login':
        updates.login_count = db.raw('login_count + 1');
        break;
    }

    await db('user_activity')
      .insert({
        user_id: userId,
        team_id: teamId,
        date,
        ...updates,
      })
      .onConflict(['user_id', 'team_id', 'date'])
      .merge(updates);
  }

  private async updateTeamAnalytics(teamId: string, date: string, eventType: string): Promise<void> {
    const updates: any = {};
    
    switch (eventType) {
      case 'prd_created':
        updates.prds_created = db.raw('prds_created + 1');
        break;
      case 'prd_edited':
        updates.prds_edited = db.raw('prds_edited + 1');
        break;
      case 'comment_added':
        updates.comments_added = db.raw('comments_added + 1');
        break;
      case 'collaboration_started':
        updates.collaboration_sessions = db.raw('collaboration_sessions + 1');
        break;
    }

    if (Object.keys(updates).length > 0) {
      await db('team_analytics')
        .insert({
          team_id: teamId,
          date,
          ...updates,
        })
        .onConflict(['team_id', 'date'])
        .merge(updates);
    }
  }

  private async updatePRDAnalytics(prdId: string, eventType: string): Promise<void> {
    const updates: any = {};
    
    switch (eventType) {
      case 'prd_viewed':
        updates.view_count = db.raw('view_count + 1');
        updates.first_viewed_at = db.raw('COALESCE(first_viewed_at, NOW())');
        break;
      case 'prd_edited':
        updates.edit_count = db.raw('edit_count + 1');
        updates.last_edited_at = new Date();
        break;
      case 'comment_added':
        updates.comment_count = db.raw('comment_count + 1');
        break;
      case 'collaboration_started':
        updates.collaboration_sessions = db.raw('collaboration_sessions + 1');
        break;
      case 'ai_generation_used':
        updates.ai_generations_used = db.raw('ai_generations_used + 1');
        break;
    }

    if (Object.keys(updates).length > 0) {
      await db('prd_analytics')
        .insert({
          prd_id: prdId,
          ...updates,
        })
        .onConflict(['prd_id'])
        .merge(updates);
    }
  }

  private async updateTemplateAnalytics(templateName: string, templateType: string, teamId: string | undefined, date: string): Promise<void> {
    await db('template_analytics')
      .insert({
        template_name: templateName,
        template_type: templateType,
        team_id: teamId,
        date,
        usage_count: 1,
      })
      .onConflict(['template_name', 'team_id', 'date'])
      .merge({
        usage_count: db.raw('usage_count + 1'),
      });
  }

  private async calculateRetentionRate(teamId: string | undefined, days: number): Promise<number> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    const cohortDate = new Date(startDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const baseQuery = teamId 
      ? db('user_activity').where('team_id', teamId)
      : db('user_activity');

    const cohortUsers = await baseQuery
      .clone()
      .where('date', '>=', cohortDate.toISOString().split('T')[0])
      .where('date', '<', startDate.toISOString().split('T')[0])
      .countDistinct('user_id as count')
      .first();

    const returnedUsers = await baseQuery
      .clone()
      .where('date', '>=', startDate.toISOString().split('T')[0])
      .where('date', '<=', endDate.toISOString().split('T')[0])
      .whereIn('user_id', 
        baseQuery
          .clone()
          .where('date', '>=', cohortDate.toISOString().split('T')[0])
          .where('date', '<', startDate.toISOString().split('T')[0])
          .distinct('user_id')
      )
      .countDistinct('user_id as count')
      .first();

    const cohortCount = parseInt(String(cohortUsers?.count || 0)) || 0;
    const returnedCount = parseInt(String(returnedUsers?.count || 0)) || 0;

    return cohortCount > 0 ? (returnedCount / cohortCount) * 100 : 0;
  }

  private getDateRange(timeRange: string) {
    const now = new Date();
    const ranges: Record<string, any> = {
      '7d': {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        weekAgo: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        monthAgo: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        twoMonthsAgo: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        yearAgo: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      },
      '30d': {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        weekAgo: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        monthAgo: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        twoMonthsAgo: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        yearAgo: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      },
      '90d': {
        start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        weekAgo: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        monthAgo: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        twoMonthsAgo: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        yearAgo: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      },
    };

    return ranges[timeRange] || ranges['30d'];
  }
}

export const analyticsService = new AnalyticsService();