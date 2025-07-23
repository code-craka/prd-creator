import { db } from '../config/database';
import { safeParseInt } from '../utils/helpers';

export interface ViralAction {
  id: string;
  user_id: string;
  action_type: 'share' | 'invite' | 'referral' | 'like' | 'clone' | 'view';
  content_type: 'prd' | 'template' | 'blog_post' | 'case_study';
  content_id: string;
  platform?: string;
  referrer_url?: string;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface ViralMetrics {
  viral_coefficient: number;
  organic_shares: number;
  total_referrals: number;
  conversion_rate: number;
  k_factor: number; // Number of new users generated per existing user
  cycle_time: number; // Average time for viral cycle completion
}

export class ViralTrackingService {
  // Track viral action
  static async trackAction(
    userId: string,
    actionType: ViralAction['action_type'],
    contentType: ViralAction['content_type'],
    contentId: string,
    metadata: Record<string, string | number | boolean | null> = {}
  ): Promise<ViralAction> {
    const action = await db('viral_actions')
      .insert({
        user_id: userId,
        action_type: actionType,
        content_type: contentType,
        content_id: contentId,
        platform: metadata.platform || null,
        referrer_url: metadata.referrer_url || null,
        metadata: JSON.stringify(metadata)
      })
      .returning('*');

    return action[0];
  }

  // Calculate viral coefficient for time period
  static async calculateViralCoefficient(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Viral coefficient = (Number of invitations sent) × (Conversion rate of invitations)
    const [invitations, conversions] = await Promise.all([
      // Count invitations sent in period
      db('viral_actions')
        .where('action_type', 'invite')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first(),

      // Count successful conversions from invitations
      db('referrals')
        .where('status', 'converted')
        .whereBetween('converted_at', [startDate, endDate])
        .count('* as count')
        .first()
    ]);

    const inviteCount = safeParseInt(invitations?.count, 0);
    const conversionCount = safeParseInt(conversions?.count, 0);

    if (inviteCount === 0) return 0;

    return conversionCount / inviteCount;
  }

  // Calculate K-factor (virality metric)
  static async calculateKFactor(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // K-factor = (Number of invites sent by existing users) × (Conversion rate)
    const existingUsers = await db('users')
      .whereBetween('created_at', [startDate, endDate])
      .count('* as count')
      .first();

    const existingUserCount = safeParseInt(existingUsers?.count, 0);
    if (existingUserCount === 0) return 0;

    const viralCoefficient = await ViralTrackingService.calculateViralCoefficient(startDate, endDate);
    
    return viralCoefficient;
  }

  // Get viral funnel metrics
  async getViralFunnelMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    content_shared: number;
    clicks_generated: number;
    signups_generated: number;
    activations_generated: number;
    funnel_conversion_rates: {
      share_to_click: number;
      click_to_signup: number;
      signup_to_activation: number;
      overall: number;
    };
  }> {
    const [shares, clicks, signups, activations] = await Promise.all([
      // Content shares
      db('viral_actions')
        .where('action_type', 'share')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first(),

      // Clicks from shared content (tracked via referrer URLs)
      db('conversion_events')
        .where('event_type', 'page_view')
        .whereNotNull('referrer_url')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first(),

      // Signups from viral traffic
      db('conversion_events')
        .where('event_type', 'signup')
        .whereNotNull('referrer_url')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first(),

      // Activations from viral signups
      db('conversion_events')
        .where('event_type', 'activation')
        .whereNotNull('referrer_url')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first()
    ]);

    const shareCount = safeParseInt(shares?.count, 0);
    const clickCount = safeParseInt(clicks?.count, 0);
    const signupCount = safeParseInt(signups?.count, 0);
    const activationCount = safeParseInt(activations?.count, 0);

    const shareToClick = shareCount > 0 ? clickCount / shareCount : 0;
    const clickToSignup = clickCount > 0 ? signupCount / clickCount : 0;
    const signupToActivation = signupCount > 0 ? activationCount / signupCount : 0;
    const overall = shareCount > 0 ? activationCount / shareCount : 0;

    return {
      content_shared: shareCount,
      clicks_generated: clickCount,
      signups_generated: signupCount,
      activations_generated: activationCount,
      funnel_conversion_rates: {
        share_to_click: shareToClick,
        click_to_signup: clickToSignup,
        signup_to_activation: signupToActivation,
        overall
      }
    };
  }

  // Get top viral content
  static async getTopViralContent(
    contentType?: ViralAction['content_type'],
    timeRange: '7d' | '30d' | '90d' = '30d',
    limit = 10
  ): Promise<Array<{
    content_id: string;
    content_type: string;
    title?: string;
    total_shares: number;
    total_likes: number;
    total_clones: number;
    viral_score: number;
  }>> {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    let query = db('viral_actions')
      .select([
        'content_id',
        'content_type',
        db.raw('COUNT(CASE WHEN action_type = \'share\' THEN 1 END) as total_shares'),
        db.raw('COUNT(CASE WHEN action_type = \'like\' THEN 1 END) as total_likes'),
        db.raw('COUNT(CASE WHEN action_type = \'clone\' THEN 1 END) as total_clones'),
        db.raw('COUNT(*) as total_actions')
      ])
      .where('created_at', '>=', startDate)
      .groupBy(['content_id', 'content_type']);

    if (contentType) {
      query = query.where('content_type', contentType);
    }

    const results = await query
      .orderByRaw('COUNT(*) DESC')
      .limit(limit);

    // Calculate viral score and add content details
    const contentWithDetails = await Promise.all(
      results.map(async (item) => {
        let title = null;

        // Get content title based on type
        if (item.content_type === 'prd') {
          const prd = await db('prds')
            .select('title')
            .where('id', item.content_id)
            .first();
          title = prd?.title;
        } else if (item.content_type === 'template') {
          const template = await db('prd_templates')
            .select('name as title')
            .where('id', item.content_id)
            .first();
          title = template?.title;
        }

        // Calculate viral score (weighted by action type)
        const viralScore = 
          safeParseInt(item.total_shares, 0) * 3 +
          safeParseInt(item.total_likes, 0) * 1 +
          safeParseInt(item.total_clones, 0) * 5;

        return {
          content_id: item.content_id,
          content_type: item.content_type,
          title,
          total_shares: safeParseInt(item.total_shares, 0),
          total_likes: safeParseInt(item.total_likes, 0),
          total_clones: safeParseInt(item.total_clones, 0),
          viral_score: viralScore
        };
      })
    );

    return contentWithDetails.sort((a, b) => b.viral_score - a.viral_score);
  }

  // Get user viral activity
  async getUserViralActivity(
    userId: string,
    timeRange: '7d' | '30d' | '90d' = '30d'
  ): Promise<{
    total_shares: number;
    total_invites: number;
    total_referrals: number;
    viral_score: number;
    top_shared_content: Array<{
      content_id: string;
      content_type: string;
      title?: string;
      share_count: number;
    }>;
  }> {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    const [activity, referrals, topContent] = await Promise.all([
      // User's viral actions
      db('viral_actions')
        .select([
          db.raw(`COUNT(CASE WHEN action_type = 'share' THEN 1 END) as total_shares`),
          db.raw(`COUNT(CASE WHEN action_type = 'invite' THEN 1 END) as total_invites`)
        ])
        .where('user_id', userId)
        .where('created_at', '>=', startDate)
        .first(),

      // Successful referrals
      db('referrals')
        .where('referrer_id', userId)
        .where('status', 'converted')
        .whereBetween('converted_at', [startDate, new Date()])
        .count('* as count')
        .first(),

      // Top shared content
      db('viral_actions')
        .select([
          'content_id',
          'content_type',
          db.raw('COUNT(*) as share_count')
        ])
        .where('user_id', userId)
        .where('action_type', 'share')
        .where('created_at', '>=', startDate)
        .groupBy(['content_id', 'content_type'])
        .orderBy('share_count', 'desc')
        .limit(5)
    ]);

    const totalShares = safeParseInt(activity?.total_shares, 0);
    const totalInvites = safeParseInt(activity?.total_invites, 0);
    const totalReferrals = safeParseInt(referrals?.count, 0);

    // Calculate viral score
    const viralScore = totalShares * 2 + totalInvites * 3 + totalReferrals * 5;

    // Add content titles to top shared content
    const topSharedWithTitles = await Promise.all(
      topContent.map(async (item) => {
        let title = null;
        
        if (item.content_type === 'prd') {
          const prd = await db('prds')
            .select('title')
            .where('id', item.content_id)
            .first();
          title = prd?.title;
        }

        return {
          content_id: item.content_id,
          content_type: item.content_type,
          title,
          share_count: safeParseInt(item.share_count, 0)
        };
      })
    );

    return {
      total_shares: totalShares,
      total_invites: totalInvites,
      total_referrals: totalReferrals,
      viral_score: viralScore,
      top_shared_content: topSharedWithTitles
    };
  }

  // Track social media shares with platform details
  async trackSocialShare(
    userId: string,
    contentType: ViralAction['content_type'],
    contentId: string,
    platform: string,
    additionalData: Record<string, any> = {}
  ): Promise<void> {
    await ViralTrackingService.trackAction(userId, 'share', contentType, contentId, {
      platform,
      ...additionalData
    });
  }

  // Get viral metrics summary
  async getViralMetricsSummary(
    startDate: Date,
    endDate: Date
  ): Promise<ViralMetrics> {
    const [viralCoefficient, funnelMetrics, cycleTime] = await Promise.all([
      ViralTrackingService.calculateViralCoefficient(startDate, endDate),
      this.getViralFunnelMetrics(startDate, endDate),
      this.calculateAverageCycleTime(startDate, endDate)
    ]);

    const kFactor = await ViralTrackingService.calculateKFactor(startDate, endDate);

    return {
      viral_coefficient: viralCoefficient,
      organic_shares: funnelMetrics.content_shared,
      total_referrals: funnelMetrics.signups_generated,
      conversion_rate: funnelMetrics.funnel_conversion_rates.overall,
      k_factor: kFactor,
      cycle_time: cycleTime
    };
  }

  // Calculate average viral cycle time
  private async calculateAverageCycleTime(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Calculate time from share to conversion
    const cycles = await db('viral_actions as va')
      .join('conversion_events as ce', function() {
        this.on('ce.user_id', 'va.user_id')
            .andOn('ce.created_at', '>', 'va.created_at');
      })
      .select([
        'va.created_at as share_time',
        'ce.created_at as conversion_time'
      ])
      .where('va.action_type', 'share')
      .where('ce.event_type', 'signup')
      .whereBetween('va.created_at', [startDate, endDate])
      .limit(1000); // Limit for performance

    if (cycles.length === 0) return 0;

    const totalTime = cycles.reduce((sum, cycle) => {
      const timeDiff = new Date(cycle.conversion_time).getTime() - 
                      new Date(cycle.share_time).getTime();
      return sum + timeDiff;
    }, 0);

    // Return average cycle time in hours
    return (totalTime / cycles.length) / (1000 * 60 * 60);
  }
}

export const viralTrackingService = new ViralTrackingService();