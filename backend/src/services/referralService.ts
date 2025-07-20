import { db } from '../config/database';
import crypto from 'crypto';

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  uses_count: number;
  max_uses: number | null;
  expires_at: Date | null;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code_id: string | null;
  status: 'pending' | 'converted' | 'rewarded';
  converted_at: Date | null;
  rewarded_at: Date | null;
  conversion_data: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ReferralReward {
  id: string;
  user_id: string;
  referral_id: string;
  reward_type: 'credits' | 'subscription' | 'feature_unlock' | 'discount';
  reward_value: string;
  description: string;
  is_claimed: boolean;
  claimed_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ReferralStats {
  total_referrals: number;
  successful_conversions: number;
  pending_conversions: number;
  total_rewards_earned: number;
  total_rewards_claimed: number;
  conversion_rate: number;
  referral_code: {
    code: string;
    uses_count: number;
    max_uses: number | null;
  };
  recent_referrals: Array<{
    referred_user: {
      name: string;
      email: string;
      avatar_url: string | null;
    };
    status: string;
    referred_at: Date;
    converted_at: Date | null;
  }>;
}

class ReferralService {
  // Generate unique referral code for user
  async generateReferralCode(
    userId: string,
    options: {
      customCode?: string;
      maxUses?: number;
      expiresAt?: Date;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<ReferralCode> {
    const { customCode, maxUses, expiresAt, metadata = {} } = options;

    // Check if user already has an active referral code
    const existingCode = await db('referral_codes')
      .where('user_id', userId)
      .where('is_active', true)
      .first();

    if (existingCode && !customCode) {
      return existingCode;
    }

    let code = customCode;
    if (!code) {
      // Generate unique code
      do {
        code = this.generateRandomCode();
      } while (await this.codeExists(code));
    } else {
      // Validate custom code
      if (await this.codeExists(code)) {
        throw new Error('Referral code already exists');
      }
    }

    const referralCode = await db('referral_codes')
      .insert({
        user_id: userId,
        code,
        max_uses: maxUses || null,
        expires_at: expiresAt || null,
        metadata: JSON.stringify(metadata)
      })
      .returning('*');

    return referralCode[0];
  }

  // Process referral signup
  async processReferralSignup(
    referralCode: string,
    newUserId: string
  ): Promise<{ referral: Referral; reward: ReferralReward | null }> {
    const code = await db('referral_codes')
      .where('code', referralCode)
      .where('is_active', true)
      .first();

    if (!code) {
      throw new Error('Invalid or expired referral code');
    }

    // Check if code has usage limits
    if (code.max_uses && code.uses_count >= code.max_uses) {
      throw new Error('Referral code usage limit exceeded');
    }

    // Check if code has expired
    if (code.expires_at && new Date() > new Date(code.expires_at)) {
      throw new Error('Referral code has expired');
    }

    // Check if user is trying to refer themselves
    if (code.user_id === newUserId) {
      throw new Error('Cannot use your own referral code');
    }

    // Check if referral already exists
    const existingReferral = await db('referrals')
      .where('referred_id', newUserId)
      .first();

    if (existingReferral) {
      throw new Error('User already referred');
    }

    // Create referral record
    const referral = await db('referrals')
      .insert({
        referrer_id: code.user_id,
        referred_id: newUserId,
        referral_code_id: code.id,
        status: 'pending',
        conversion_data: JSON.stringify({
          signup_source: 'referral_code',
          code: referralCode
        })
      })
      .returning('*');

    // Increment code usage
    await db('referral_codes')
      .where('id', code.id)
      .increment('uses_count', 1);

    // Create signup reward for referrer
    const reward = await this.createReferralReward(
      code.user_id,
      referral[0].id,
      'signup'
    );

    return {
      referral: referral[0],
      reward
    };
  }

  // Mark referral as converted (e.g., when user creates first PRD)
  async convertReferral(
    userId: string,
    conversionType: 'first_prd' | 'subscription' | 'team_creation'
  ): Promise<ReferralReward[]> {
    const referral = await db('referrals')
      .where('referred_id', userId)
      .where('status', 'pending')
      .first();

    if (!referral) {
      return []; // No pending referral
    }

    // Update referral status
    await db('referrals')
      .where('id', referral.id)
      .update({
        status: 'converted',
        converted_at: new Date(),
        conversion_data: JSON.stringify({
          ...JSON.parse(referral.conversion_data || '{}'),
          conversion_type: conversionType,
          converted_at: new Date()
        })
      });

    // Create conversion rewards
    const rewards = await Promise.all([
      // Reward for referrer
      this.createReferralReward(referral.referrer_id, referral.id, conversionType),
      // Bonus reward for referred user on first conversion
      conversionType === 'first_prd' 
        ? this.createReferralReward(referral.referred_id, referral.id, 'welcome_bonus')
        : null
    ]);

    return rewards.filter(Boolean) as ReferralReward[];
  }

  // Get user's referral statistics
  async getUserReferralStats(userId: string): Promise<ReferralStats> {
    const [referralCode, stats, recentReferrals] = await Promise.all([
      // Get user's referral code
      db('referral_codes')
        .where('user_id', userId)
        .where('is_active', true)
        .first(),

      // Get referral statistics
      db('referrals')
        .where('referrer_id', userId)
        .select([
          db.raw('COUNT(*) as total_referrals'),
          db.raw(`COUNT(CASE WHEN status = 'converted' THEN 1 END) as successful_conversions`),
          db.raw(`COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_conversions`)
        ])
        .first(),

      // Get recent referrals with user details
      db('referrals as r')
        .leftJoin('users as u', 'r.referred_id', 'u.id')
        .select([
          'u.name',
          'u.email',
          'u.avatar_url',
          'r.status',
          'r.created_at as referred_at',
          'r.converted_at'
        ])
        .where('r.referrer_id', userId)
        .orderBy('r.created_at', 'desc')
        .limit(10)
    ]);

    const [rewardsStats] = await Promise.all([
      // Get reward statistics
      db('referral_rewards')
        .where('user_id', userId)
        .select([
          db.raw('COUNT(*) as total_rewards_earned'),
          db.raw(`COUNT(CASE WHEN is_claimed = true THEN 1 END) as total_rewards_claimed`)
        ])
        .first()
    ]);

    const totalReferrals = parseInt(stats?.total_referrals || '0');
    const successfulConversions = parseInt(stats?.successful_conversions || '0');
    const conversionRate = totalReferrals > 0 ? (successfulConversions / totalReferrals) * 100 : 0;

    return {
      total_referrals: totalReferrals,
      successful_conversions: successfulConversions,
      pending_conversions: parseInt(stats?.pending_conversions || '0'),
      total_rewards_earned: parseInt(rewardsStats?.total_rewards_earned || '0'),
      total_rewards_claimed: parseInt(rewardsStats?.total_rewards_claimed || '0'),
      conversion_rate: conversionRate,
      referral_code: referralCode ? {
        code: referralCode.code,
        uses_count: referralCode.uses_count,
        max_uses: referralCode.max_uses
      } : await this.generateReferralCode(userId).then(code => ({
        code: code.code,
        uses_count: code.uses_count,
        max_uses: code.max_uses
      })),
      recent_referrals: recentReferrals.map(referral => ({
        referred_user: {
          name: referral.name,
          email: referral.email,
          avatar_url: referral.avatar_url
        },
        status: referral.status,
        referred_at: referral.referred_at,
        converted_at: referral.converted_at
      }))
    };
  }

  // Get user's referral rewards
  async getUserReferralRewards(
    userId: string,
    includeExpired: boolean = false
  ): Promise<ReferralReward[]> {
    let query = db('referral_rewards as rr')
      .leftJoin('referrals as r', 'rr.referral_id', 'r.id')
      .leftJoin('users as u', 'r.referred_id', 'u.id')
      .select([
        'rr.*',
        'u.name as referred_user_name'
      ])
      .where('rr.user_id', userId);

    if (!includeExpired) {
      query = query.where(function() {
        this.whereNull('rr.expires_at')
            .orWhere('rr.expires_at', '>', new Date());
      });
    }

    const rewards = await query.orderBy('rr.created_at', 'desc');

    return rewards.map(reward => ({
      ...reward,
      metadata: JSON.parse(reward.metadata || '{}')
    }));
  }

  // Claim referral reward
  async claimReferralReward(userId: string, rewardId: string): Promise<ReferralReward> {
    const reward = await db('referral_rewards')
      .where('id', rewardId)
      .where('user_id', userId)
      .where('is_claimed', false)
      .first();

    if (!reward) {
      throw new Error('Reward not found or already claimed');
    }

    // Check if reward has expired
    if (reward.expires_at && new Date() > new Date(reward.expires_at)) {
      throw new Error('Reward has expired');
    }

    // Mark reward as claimed
    const claimedReward = await db('referral_rewards')
      .where('id', rewardId)
      .update({
        is_claimed: true,
        claimed_at: new Date()
      })
      .returning('*');

    // Apply reward based on type
    await this.applyReward(userId, reward);

    return claimedReward[0];
  }

  // Get referral program analytics
  async getReferralAnalytics(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<{
    total_referrals: number;
    conversion_rate: number;
    top_referrers: Array<{
      user: { name: string; email: string };
      referral_count: number;
      conversion_count: number;
      conversion_rate: number;
    }>;
    daily_referrals: Array<{
      date: string;
      referrals: number;
      conversions: number;
    }>;
    reward_distribution: Array<{
      reward_type: string;
      count: number;
      claimed_count: number;
    }>;
  }> {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    const [totalStats, topReferrers, dailyStats, rewardStats] = await Promise.all([
      // Total referral statistics
      db('referrals')
        .whereBetween('created_at', [startDate, new Date()])
        .select([
          db.raw('COUNT(*) as total_referrals'),
          db.raw(`COUNT(CASE WHEN status = 'converted' THEN 1 END) as total_conversions`)
        ])
        .first(),

      // Top referrers
      db('referrals as r')
        .leftJoin('users as u', 'r.referrer_id', 'u.id')
        .select([
          'u.name',
          'u.email',
          'r.referrer_id',
          db.raw('COUNT(*) as referral_count'),
          db.raw(`COUNT(CASE WHEN r.status = 'converted' THEN 1 END) as conversion_count`)
        ])
        .whereBetween('r.created_at', [startDate, new Date()])
        .groupBy(['r.referrer_id', 'u.name', 'u.email'])
        .orderBy('referral_count', 'desc')
        .limit(10),

      // Daily referral trends
      db('referrals')
        .select([
          db.raw('DATE(created_at) as date'),
          db.raw('COUNT(*) as referrals'),
          db.raw(`COUNT(CASE WHEN status = 'converted' THEN 1 END) as conversions`)
        ])
        .whereBetween('created_at', [startDate, new Date()])
        .groupBy(db.raw('DATE(created_at)'))
        .orderBy('date'),

      // Reward distribution
      db('referral_rewards')
        .select([
          'reward_type',
          db.raw('COUNT(*) as count'),
          db.raw('COUNT(CASE WHEN is_claimed = true THEN 1 END) as claimed_count')
        ])
        .whereBetween('created_at', [startDate, new Date()])
        .groupBy('reward_type')
    ]);

    const totalReferrals = parseInt(totalStats?.total_referrals || '0');
    const totalConversions = parseInt(totalStats?.total_conversions || '0');
    const conversionRate = totalReferrals > 0 ? (totalConversions / totalReferrals) * 100 : 0;

    return {
      total_referrals: totalReferrals,
      conversion_rate: conversionRate,
      top_referrers: topReferrers.map(referrer => ({
        user: {
          name: referrer.name,
          email: referrer.email
        },
        referral_count: parseInt(referrer.referral_count),
        conversion_count: parseInt(referrer.conversion_count),
        conversion_rate: referrer.referral_count > 0 
          ? (parseInt(referrer.conversion_count) / parseInt(referrer.referral_count)) * 100 
          : 0
      })),
      daily_referrals: dailyStats.map((day: any) => ({
        date: day.date,
        referrals: parseInt(day.referrals),
        conversions: parseInt(day.conversions)
      })),
      reward_distribution: rewardStats.map(reward => ({
        reward_type: reward.reward_type,
        count: parseInt(reward.count),
        claimed_count: parseInt(reward.claimed_count)
      }))
    };
  }

  // Private helper methods
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
  }

  private async codeExists(code: string): Promise<boolean> {
    const existing = await db('referral_codes')
      .where('code', code)
      .first();
    return !!existing;
  }

  private async createReferralReward(
    userId: string,
    referralId: string,
    rewardType: string
  ): Promise<ReferralReward> {
    const rewardConfig = this.getRewardConfig(rewardType);

    const reward = await db('referral_rewards')
      .insert({
        user_id: userId,
        referral_id: referralId,
        reward_type: rewardConfig.type,
        reward_value: rewardConfig.value,
        description: rewardConfig.description,
        expires_at: rewardConfig.expiresAt
      })
      .returning('*');

    return reward[0];
  }

  private getRewardConfig(rewardType: string) {
    const configs = {
      signup: {
        type: 'credits',
        value: '10',
        description: 'Earned 10 credits for successful referral signup',
        expiresAt: null
      },
      first_prd: {
        type: 'credits',
        value: '25',
        description: 'Earned 25 credits for referral creating their first PRD',
        expiresAt: null
      },
      subscription: {
        type: 'credits',
        value: '100',
        description: 'Earned 100 credits for referral subscribing to Pro plan',
        expiresAt: null
      },
      team_creation: {
        type: 'feature_unlock',
        value: 'advanced_analytics',
        description: 'Unlocked advanced analytics for referral creating a team',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      welcome_bonus: {
        type: 'credits',
        value: '5',
        description: 'Welcome bonus for joining via referral',
        expiresAt: null
      }
    };

    return configs[rewardType as keyof typeof configs] || configs.signup;
  }

  private async applyReward(userId: string, reward: ReferralReward): Promise<void> {
    switch (reward.reward_type) {
      case 'credits':
        // Add credits to user account (implement based on your credit system)
        // await userService.addCredits(userId, parseInt(reward.reward_value));
        break;
      case 'subscription':
        // Extend subscription or apply discount
        // await subscriptionService.applyReferralBonus(userId, reward.reward_value);
        break;
      case 'feature_unlock':
        // Unlock premium features temporarily
        // await featureService.unlockFeature(userId, reward.reward_value, reward.expires_at);
        break;
    }
  }
}

export const referralService = new ReferralService();