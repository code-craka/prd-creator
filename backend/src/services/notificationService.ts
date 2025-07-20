import { db } from '../config/database';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'achievement' | 'milestone' | 'social' | 'system' | 'collaboration';
  trigger_event: string;
  title_template: string;
  message_template: string;
  icon: string | null;
  color: string | null;
  action_url: string | null;
  action_text: string | null;
  is_active: boolean;
  priority: 1 | 2 | 3; // 1=low, 2=medium, 3=high
  created_at: Date;
  updated_at: Date;
}

export interface UserNotification {
  id: string;
  user_id: string;
  template_id: string | null;
  type: string;
  title: string;
  message: string;
  icon: string | null;
  color: string | null;
  action_url: string | null;
  action_text: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  priority: number;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: 'creation' | 'collaboration' | 'growth' | 'engagement';
  points: number;
  badge_color: string;
  criteria: Record<string, any>;
  is_active: boolean;
  is_hidden: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: Date;
  progress_data: Record<string, any>;
  is_notified: boolean;
  created_at: Date;
  updated_at: Date;
}

class NotificationService {
  // Create notification template
  async createNotificationTemplate(templateData: {
    name: string;
    type: NotificationTemplate['type'];
    trigger_event: string;
    title_template: string;
    message_template: string;
    icon?: string;
    color?: string;
    action_url?: string;
    action_text?: string;
    priority?: 1 | 2 | 3;
  }): Promise<NotificationTemplate> {
    const template = await db('notification_templates')
      .insert({
        ...templateData,
        priority: templateData.priority || 1
      })
      .returning('*');

    return template[0];
  }

  // Trigger notification for user
  async triggerNotification(
    userId: string,
    event: string,
    eventData: Record<string, any> = {}
  ): Promise<UserNotification[]> {
    // Find active templates for this event
    const templates = await db('notification_templates')
      .where('trigger_event', event)
      .where('is_active', true);

    const notifications: UserNotification[] = [];

    for (const template of templates) {
      const notification = await this.createNotificationFromTemplate(
        userId,
        template,
        eventData
      );
      notifications.push(notification);
    }

    return notifications;
  }

  // Create notification from template
  async createNotificationFromTemplate(
    userId: string,
    template: NotificationTemplate,
    data: Record<string, any>
  ): Promise<UserNotification> {
    // Personalize content
    const title = this.personalizeContent(template.title_template, data);
    const message = this.personalizeContent(template.message_template, data);
    const actionUrl = template.action_url 
      ? this.personalizeContent(template.action_url, data)
      : null;

    const notification = await db('user_notifications')
      .insert({
        user_id: userId,
        template_id: template.id,
        type: template.type,
        title,
        message,
        icon: template.icon,
        color: template.color,
        action_url: actionUrl,
        action_text: template.action_text,
        priority: template.priority,
        metadata: JSON.stringify(data)
      })
      .returning('*');

    return {
      ...notification[0],
      metadata: JSON.parse(notification[0].metadata || '{}')
    };
  }

  // Create custom notification
  async createNotification(notificationData: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    icon?: string;
    color?: string;
    action_url?: string;
    action_text?: string;
    priority?: number;
    metadata?: Record<string, any>;
  }): Promise<UserNotification> {
    const notification = await db('user_notifications')
      .insert({
        ...notificationData,
        metadata: JSON.stringify(notificationData.metadata || {})
      })
      .returning('*');

    return {
      ...notification[0],
      metadata: JSON.parse(notification[0].metadata || '{}')
    };
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    filters: {
      unread_only?: boolean;
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    notifications: UserNotification[];
    total: number;
    unread_count: number;
  }> {
    const { unread_only = false, type, limit = 20, offset = 0 } = filters;

    let query = db('user_notifications')
      .where('user_id', userId)
      .where('is_dismissed', false);

    if (unread_only) {
      query = query.where('is_read', false);
    }

    if (type) {
      query = query.where('type', type);
    }

    // Get total count
    const totalQuery = query.clone().count('* as total');
    const totalResult = await totalQuery.first();
    const total = parseInt(totalResult?.total as string) || 0;

    // Get unread count
    const unreadQuery = db('user_notifications')
      .where('user_id', userId)
      .where('is_read', false)
      .where('is_dismissed', false)
      .count('* as count');
    const unreadResult = await unreadQuery.first();
    const unreadCount = parseInt(unreadResult?.count as string) || 0;

    // Get notifications
    const notifications = await query
      .orderBy([
        { column: 'priority', order: 'desc' },
        { column: 'created_at', order: 'desc' }
      ])
      .limit(limit)
      .offset(offset);

    return {
      notifications: notifications.map(n => ({
        ...n,
        metadata: JSON.parse(n.metadata || '{}')
      })),
      total,
      unread_count: unreadCount
    };
  }

  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await db('user_notifications')
      .where('id', notificationId)
      .where('user_id', userId)
      .update({ is_read: true });
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    await db('user_notifications')
      .where('user_id', userId)
      .update({ is_read: true });
  }

  // Dismiss notification
  async dismissNotification(userId: string, notificationId: string): Promise<void> {
    await db('user_notifications')
      .where('id', notificationId)
      .where('user_id', userId)
      .update({ is_dismissed: true });
  }

  // Create achievement
  async createAchievement(achievementData: {
    key: string;
    title: string;
    description: string;
    icon: string;
    category: Achievement['category'];
    points?: number;
    badge_color: string;
    criteria: Record<string, any>;
    is_hidden?: boolean;
  }): Promise<Achievement> {
    const achievement = await db('achievements')
      .insert({
        ...achievementData,
        points: achievementData.points || 0,
        is_hidden: achievementData.is_hidden || false
      })
      .returning('*');

    return {
      ...achievement[0],
      criteria: JSON.parse(achievement[0].criteria || '{}')
    };
  }

  // Check and award achievements for user
  async checkAchievements(userId: string, event: string, eventData: Record<string, any> = {}): Promise<UserAchievement[]> {
    // Get all active achievements
    const achievements = await db('achievements')
      .where('is_active', true);

    const awardedAchievements: UserAchievement[] = [];

    for (const achievement of achievements) {
      // Check if user already has this achievement
      const existingAchievement = await db('user_achievements')
        .where('user_id', userId)
        .where('achievement_id', achievement.id)
        .first();

      if (existingAchievement) continue;

      // Check if user meets criteria
      const meetssCriteria = await this.checkAchievementCriteria(
        userId,
        achievement,
        event,
        eventData
      );

      if (meetssCriteria) {
        const userAchievement = await this.awardAchievement(userId, achievement.id);
        awardedAchievements.push(userAchievement);

        // Create achievement notification
        await this.triggerNotification(userId, 'achievement_earned', {
          achievement_title: achievement.title,
          achievement_description: achievement.description,
          achievement_icon: achievement.icon,
          achievement_points: achievement.points
        });
      }
    }

    return awardedAchievements;
  }

  // Award achievement to user
  async awardAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    const userAchievement = await db('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        progress_data: JSON.stringify({})
      })
      .returning('*');

    return {
      ...userAchievement[0],
      progress_data: JSON.parse(userAchievement[0].progress_data || '{}')
    };
  }

  // Get user achievements
  async getUserAchievements(userId: string): Promise<{
    earned_achievements: Array<Achievement & { earned_at: Date }>;
    available_achievements: Achievement[];
    total_points: number;
    completion_percentage: number;
  }> {
    const [earnedAchievements, allAchievements] = await Promise.all([
      // Get earned achievements
      db('user_achievements as ua')
        .join('achievements as a', 'ua.achievement_id', 'a.id')
        .select(['a.*', 'ua.earned_at'])
        .where('ua.user_id', userId)
        .orderBy('ua.earned_at', 'desc'),

      // Get all active achievements (excluding hidden ones user hasn't earned)
      db('achievements')
        .where('is_active', true)
        .where(function() {
          this.where('is_hidden', false)
            .orWhereIn('id', 
              db('user_achievements')
                .where('user_id', userId)
                .pluck('achievement_id')
            );
        })
    ]);

    const totalPoints = earnedAchievements.reduce((sum, achievement) => sum + achievement.points, 0);
    const completionPercentage = allAchievements.length > 0 
      ? (earnedAchievements.length / allAchievements.length) * 100 
      : 0;

    const earnedIds = new Set(earnedAchievements.map(a => a.id));
    const availableAchievements = allAchievements.filter(a => !earnedIds.has(a.id));

    return {
      earned_achievements: earnedAchievements.map(a => ({
        ...a,
        criteria: JSON.parse(a.criteria || '{}')
      })),
      available_achievements: availableAchievements.map(a => ({
        ...a,
        criteria: JSON.parse(a.criteria || '{}')
      })),
      total_points: totalPoints,
      completion_percentage: completionPercentage
    };
  }

  // Get achievement leaderboard
  async getAchievementLeaderboard(limit: number = 10): Promise<Array<{
    user: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
    total_points: number;
    achievement_count: number;
    latest_achievement: {
      title: string;
      earned_at: Date;
    } | null;
  }>> {
    const leaderboard = await db('user_achievements as ua')
      .join('achievements as a', 'ua.achievement_id', 'a.id')
      .join('users as u', 'ua.user_id', 'u.id')
      .select([
        'u.id as user_id',
        'u.name as user_name',
        'u.avatar_url',
        db.raw('SUM(a.points) as total_points'),
        db.raw('COUNT(ua.achievement_id) as achievement_count'),
        db.raw('MAX(ua.earned_at) as latest_earned_at')
      ])
      .groupBy(['u.id', 'u.name', 'u.avatar_url'])
      .orderBy('total_points', 'desc')
      .limit(limit);

    // Get latest achievement for each user
    const leaderboardWithLatest = await Promise.all(
      leaderboard.map(async (entry) => {
        const latestAchievement = await db('user_achievements as ua')
          .join('achievements as a', 'ua.achievement_id', 'a.id')
          .select(['a.title', 'ua.earned_at'])
          .where('ua.user_id', entry.user_id)
          .orderBy('ua.earned_at', 'desc')
          .first();

        return {
          user: {
            id: entry.user_id,
            name: entry.user_name,
            avatar_url: entry.avatar_url
          },
          total_points: parseInt(entry.total_points || '0'),
          achievement_count: parseInt(entry.achievement_count || '0'),
          latest_achievement: latestAchievement ? {
            title: latestAchievement.title,
            earned_at: latestAchievement.earned_at
          } : null
        };
      })
    );

    return leaderboardWithLatest;
  }

  // Private helper methods
  private personalizeContent(template: string, data: Record<string, any>): string {
    let content = template;
    
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(placeholder, data[key] || '');
    });

    return content;
  }

  private async checkAchievementCriteria(
    userId: string,
    achievement: Achievement,
    event: string,
    eventData: Record<string, any>
  ): Promise<boolean> {
    const criteria = JSON.parse(achievement.criteria || '{}');

    // Check different achievement types
    switch (achievement.key) {
      case 'first_prd':
        return event === 'prd_created' && criteria.count === 1;
      
      case 'prolific_creator':
        const prdCount = await db('prds')
          .where('user_id', userId)
          .count('* as count')
          .first();
        return parseInt(prdCount?.count as string || '0') >= criteria.prd_count;
      
      case 'team_player':
        return event === 'team_joined';
      
      case 'collaboration_master':
        const collaborationCount = await db('prd_comments')
          .where('user_id', userId)
          .count('* as count')
          .first();
        return parseInt(collaborationCount?.count as string || '0') >= criteria.comment_count;
      
      case 'viral_sharer':
        const shareCount = await db('viral_actions')
          .where('user_id', userId)
          .where('action_type', 'share')
          .count('* as count')
          .first();
        return parseInt(shareCount?.count as string || '0') >= criteria.share_count;
      
      case 'template_creator':
        return event === 'template_published';
      
      case 'early_adopter':
        const userCreatedAt = await db('users')
          .where('id', userId)
          .select('created_at')
          .first();
        const daysSinceSignup = Math.floor(
          (Date.now() - new Date(userCreatedAt?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceSignup <= criteria.max_days_since_signup;
      
      default:
        return false;
    }
  }
}

export const notificationService = new NotificationService();