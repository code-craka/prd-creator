import { db } from '../config/database';
import { viralTrackingService } from './viralTrackingService';
import { referralService } from './referralService';
import { emailMarketingService } from './emailMarketingService';

export interface GrowthMetrics {
  viral_coefficient: number;
  organic_growth_rate: number;
  paid_acquisition_cost: number;
  user_lifetime_value: number;
  churn_rate: number;
  net_promoter_score: number;
  activation_rate: number;
  retention_rates: {
    day_1: number;
    day_7: number;
    day_30: number;
    day_90: number;
  };
}

export interface ConversionFunnel {
  total_visitors: number;
  signups: number;
  activated_users: number;
  paying_users: number;
  conversion_rates: {
    visitor_to_signup: number;
    signup_to_activation: number;
    activation_to_payment: number;
    overall: number;
  };
}

export interface UserAcquisitionChannels {
  organic: {
    users: number;
    cost: number;
    ltv: number;
    roi: number;
  };
  referral: {
    users: number;
    cost: number;
    ltv: number;
    roi: number;
  };
  paid: {
    users: number;
    cost: number;
    ltv: number;
    roi: number;
  };
  social: {
    users: number;
    cost: number;
    ltv: number;
    roi: number;
  };
}

export interface CohortAnalysis {
  cohorts: Array<{
    cohort_month: string;
    users_count: number;
    retention_rates: Record<string, number>; // month_0, month_1, etc.
  }>;
  average_retention_by_month: Record<string, number>;
}

class GrowthAnalyticsService {
  // Get comprehensive growth dashboard data
  async getGrowthDashboard(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<{
    growth_metrics: GrowthMetrics;
    conversion_funnel: ConversionFunnel;
    acquisition_channels: UserAcquisitionChannels;
    viral_metrics: any;
    referral_metrics: any;
    email_performance: any;
    user_engagement: {
      daily_active_users: number;
      monthly_active_users: number;
      session_duration: number;
      pages_per_session: number;
    };
  }> {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    const endDate = new Date();

    const [
      growthMetrics,
      conversionFunnel,
      acquisitionChannels,
      viralMetrics,
      referralMetrics,
      emailPerformance,
      userEngagement
    ] = await Promise.all([
      this.calculateGrowthMetrics(startDate, endDate),
      this.getConversionFunnel(startDate, endDate),
      this.getAcquisitionChannels(startDate, endDate),
      viralTrackingService.getViralMetricsSummary(startDate, endDate),
      referralService.getReferralAnalytics(timeRange),
      emailMarketingService.getEmailAnalytics(timeRange),
      this.getUserEngagementMetrics(startDate, endDate)
    ]);

    return {
      growth_metrics: growthMetrics,
      conversion_funnel: conversionFunnel,
      acquisition_channels: acquisitionChannels,
      viral_metrics: viralMetrics,
      referral_metrics: referralMetrics,
      email_performance: emailPerformance,
      user_engagement: userEngagement
    };
  }

  // Calculate key growth metrics
  async calculateGrowthMetrics(startDate: Date, endDate: Date): Promise<GrowthMetrics> {
    const [
      viralCoefficient,
      organicGrowth,
      churnRate,
      activationRate,
      retentionRates
    ] = await Promise.all([
      this.calculateViralCoefficient(startDate, endDate),
      this.calculateOrganicGrowthRate(startDate, endDate),
      this.calculateChurnRate(startDate, endDate),
      this.calculateActivationRate(startDate, endDate),
      this.calculateRetentionRates(startDate, endDate)
    ]);

    return {
      viral_coefficient: viralCoefficient,
      organic_growth_rate: organicGrowth,
      paid_acquisition_cost: 0, // TODO: Implement when paid ads are added
      user_lifetime_value: 0, // TODO: Calculate based on subscription data
      churn_rate: churnRate,
      net_promoter_score: 0, // TODO: Implement NPS surveys
      activation_rate: activationRate,
      retention_rates: retentionRates
    };
  }

  // Get conversion funnel metrics
  async getConversionFunnel(startDate: Date, endDate: Date): Promise<ConversionFunnel> {
    const [visitors, signups, activatedUsers, payingUsers] = await Promise.all([
      // Total unique visitors
      db('conversion_events')
        .countDistinct('session_id as count')
        .where('event_type', 'page_view')
        .whereBetween('created_at', [startDate, endDate])
        .first(),

      // Signups
      db('conversion_events')
        .count('* as count')
        .where('event_type', 'signup')
        .whereBetween('created_at', [startDate, endDate])
        .first(),

      // Activated users (created first PRD)
      db('conversion_events')
        .count('* as count')
        .where('event_type', 'activation')
        .whereBetween('created_at', [startDate, endDate])
        .first(),

      // Paying users (subscribed)
      db('conversion_events')
        .count('* as count')
        .where('event_type', 'conversion')
        .whereBetween('created_at', [startDate, endDate])
        .first()
    ]);

    const totalVisitors = parseInt(visitors?.count as string || '0');
    const totalSignups = parseInt(signups?.count as string || '0');
    const totalActivated = parseInt(activatedUsers?.count as string || '0');
    const totalPaying = parseInt(payingUsers?.count as string || '0');

    const visitorToSignup = totalVisitors > 0 ? (totalSignups / totalVisitors) * 100 : 0;
    const signupToActivation = totalSignups > 0 ? (totalActivated / totalSignups) * 100 : 0;
    const activationToPayment = totalActivated > 0 ? (totalPaying / totalActivated) * 100 : 0;
    const overall = totalVisitors > 0 ? (totalPaying / totalVisitors) * 100 : 0;

    return {
      total_visitors: totalVisitors,
      signups: totalSignups,
      activated_users: totalActivated,
      paying_users: totalPaying,
      conversion_rates: {
        visitor_to_signup: visitorToSignup,
        signup_to_activation: signupToActivation,
        activation_to_payment: activationToPayment,
        overall
      }
    };
  }

  // Get user acquisition channels performance
  async getAcquisitionChannels(startDate: Date, endDate: Date): Promise<UserAcquisitionChannels> {
    const channelData = await db('conversion_events')
      .select([
        'utm_source',
        db.raw('COUNT(DISTINCT user_id) as users'),
        db.raw('COUNT(CASE WHEN event_type = \'signup\' THEN 1 END) as signups'),
        db.raw('COUNT(CASE WHEN event_type = \'activation\' THEN 1 END) as activations')
      ])
      .whereBetween('created_at', [startDate, endDate])
      .whereNotNull('user_id')
      .groupBy('utm_source');

    const channels = {
      organic: { users: 0, cost: 0, ltv: 0, roi: 0 },
      referral: { users: 0, cost: 0, ltv: 0, roi: 0 },
      paid: { users: 0, cost: 0, ltv: 0, roi: 0 },
      social: { users: 0, cost: 0, ltv: 0, roi: 0 }
    };

    channelData.forEach(channel => {
      const source = channel.utm_source || 'organic';
      const users = parseInt(channel.users || '0');
      
      if (source.includes('referral') || source.includes('refer')) {
        channels.referral.users += users;
      } else if (source.includes('google') || source.includes('facebook') || source.includes('ads')) {
        channels.paid.users += users;
      } else if (source.includes('twitter') || source.includes('linkedin') || source.includes('social')) {
        channels.social.users += users;
      } else {
        channels.organic.users += users;
      }
    });

    // TODO: Calculate costs and LTV when payment data is available
    return channels;
  }

  // Get user engagement metrics
  async getUserEngagementMetrics(startDate: Date, endDate: Date): Promise<{
    daily_active_users: number;
    monthly_active_users: number;
    session_duration: number;
    pages_per_session: number;
  }> {
    const [dauResult, mauResult, sessionMetrics] = await Promise.all([
      // Daily Active Users (average over period)
      db('analytics_events')
        .select([
          db.raw('DATE(created_at) as date'),
          db.raw('COUNT(DISTINCT user_id) as dau')
        ])
        .whereBetween('created_at', [startDate, endDate])
        .whereNotNull('user_id')
        .groupBy(db.raw('DATE(created_at)')),

      // Monthly Active Users
      db('analytics_events')
        .countDistinct('user_id as count')
        .whereBetween('created_at', [startDate, endDate])
        .whereNotNull('user_id')
        .first(),

      // Session metrics
      db('conversion_events')
        .select([
          'session_id',
          db.raw('COUNT(*) as page_views'),
          db.raw('MAX(created_at) - MIN(created_at) as session_duration')
        ])
        .whereBetween('created_at', [startDate, endDate])
        .where('event_type', 'page_view')
        .groupBy('session_id')
        .having(db.raw('COUNT(*) > 1'))
    ]);

    const averageDau = dauResult.length > 0 
      ? dauResult.reduce((sum, day) => sum + parseInt(day.dau), 0) / dauResult.length 
      : 0;

    const mau = parseInt(mauResult?.count as string || '0');

    const averageSessionDuration = sessionMetrics.length > 0
      ? sessionMetrics.reduce((sum, session) => {
          const duration = session.session_duration || 0;
          return sum + (typeof duration === 'string' ? parseInt(duration) : duration);
        }, 0) / sessionMetrics.length / 1000 // Convert to seconds
      : 0;

    const averagePagesPerSession = sessionMetrics.length > 0
      ? sessionMetrics.reduce((sum, session) => sum + parseInt(session.page_views), 0) / sessionMetrics.length
      : 0;

    return {
      daily_active_users: Math.round(averageDau),
      monthly_active_users: mau,
      session_duration: Math.round(averageSessionDuration),
      pages_per_session: Math.round(averagePagesPerSession * 10) / 10
    };
  }

  // Generate cohort analysis
  async generateCohortAnalysis(): Promise<CohortAnalysis> {
    // Get all users grouped by signup month
    const cohorts = await db('users')
      .select([
        db.raw('DATE_TRUNC(\'month\', created_at) as cohort_month'),
        db.raw('COUNT(*) as users_count')
      ])
      .groupBy(db.raw('DATE_TRUNC(\'month\', created_at)'))
      .orderBy('cohort_month');

    const cohortAnalysis: CohortAnalysis = {
      cohorts: [],
      average_retention_by_month: {}
    };

    for (const cohort of cohorts) {
      const cohortMonth = cohort.cohort_month;
      const usersCount = parseInt(cohort.users_count);

      // Calculate retention for this cohort
      const retentionRates: Record<string, number> = {};

      for (let month = 0; month <= 12; month++) {
        const retentionMonth = new Date(cohortMonth);
        retentionMonth.setMonth(retentionMonth.getMonth() + month);
        
        const activeUsers = await db('analytics_events')
          .countDistinct('user_id as count')
          .whereIn('user_id', 
            db('users')
              .select('id')
              .where(db.raw('DATE_TRUNC(\'month\', created_at)'), cohortMonth)
          )
          .whereBetween('created_at', [
            retentionMonth,
            new Date(retentionMonth.getTime() + 30 * 24 * 60 * 60 * 1000)
          ])
          .first();

        const activeCount = parseInt(activeUsers?.count as string || '0');
        retentionRates[`month_${month}`] = usersCount > 0 ? (activeCount / usersCount) * 100 : 0;
      }

      cohortAnalysis.cohorts.push({
        cohort_month: cohortMonth,
        users_count: usersCount,
        retention_rates: retentionRates
      });
    }

    // Calculate average retention by month across all cohorts
    for (let month = 0; month <= 12; month++) {
      const monthKey = `month_${month}`;
      const totalRetention = cohortAnalysis.cohorts.reduce((sum, cohort) => {
        return sum + (cohort.retention_rates[monthKey] || 0);
      }, 0);
      
      cohortAnalysis.average_retention_by_month[monthKey] = 
        cohortAnalysis.cohorts.length > 0 ? totalRetention / cohortAnalysis.cohorts.length : 0;
    }

    return cohortAnalysis;
  }

  // Track conversion event
  async trackConversionEvent(
    sessionId: string,
    userId: string | null,
    eventType: 'page_view' | 'signup' | 'activation' | 'conversion',
    eventData: {
      page_name?: string;
      variant_id?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      referrer_url?: string;
    } = {}
  ): Promise<void> {
    await db('conversion_events')
      .insert({
        session_id: sessionId,
        user_id: userId,
        event_type: eventType,
        page_name: eventData.page_name || null,
        variant_id: eventData.variant_id || null,
        event_data: JSON.stringify(eventData),
        utm_source: eventData.utm_source || null,
        utm_medium: eventData.utm_medium || null,
        utm_campaign: eventData.utm_campaign || null,
        referrer_url: eventData.referrer_url || null
      });
  }

  // Update daily growth metrics
  async updateDailyGrowthMetrics(date: Date = new Date()): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const thirtyDaysAgo = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [viralCoefficient, conversionRate, retentionRate] = await Promise.all([
      this.calculateViralCoefficient(thirtyDaysAgo, date),
      this.calculateConversionRate(startOfDay, endOfDay),
      this.calculateRetentionRate(thirtyDaysAgo, date)
    ]);

    // Store daily metrics
    await db('growth_metrics_daily')
      .insert([
        {
          date: startOfDay,
          metric_type: 'viral_coefficient',
          segment: 'all',
          value: viralCoefficient,
          sample_size: 0
        },
        {
          date: startOfDay,
          metric_type: 'conversion_rate',
          segment: 'all',
          value: conversionRate,
          sample_size: 0
        },
        {
          date: startOfDay,
          metric_type: 'retention',
          segment: 'all',
          value: retentionRate,
          sample_size: 0
        }
      ])
      .onConflict(['date', 'metric_type', 'segment'])
      .merge();
  }

  // Get growth trends over time
  async getGrowthTrends(
    metricType: 'viral_coefficient' | 'conversion_rate' | 'retention',
    timeRange: '7d' | '30d' | '90d' = '30d',
    segment: string = 'all'
  ): Promise<Array<{ date: string; value: number }>> {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    const trends = await db('growth_metrics_daily')
      .select(['date', 'value'])
      .where('metric_type', metricType)
      .where('segment', segment)
      .where('date', '>=', startDate)
      .orderBy('date');

    return trends.map(trend => ({
      date: trend.date.toISOString().split('T')[0],
      value: parseFloat(trend.value)
    }));
  }

  // Private helper methods
  private async calculateViralCoefficient(startDate: Date, endDate: Date): Promise<number> {
    return viralTrackingService.calculateViralCoefficient(startDate, endDate);
  }

  private async calculateOrganicGrowthRate(startDate: Date, endDate: Date): Promise<number> {
    const [currentPeriod, previousPeriod] = await Promise.all([
      db('users')
        .count('* as count')
        .whereBetween('created_at', [startDate, endDate])
        .whereRaw("(utm_source IS NULL OR utm_source NOT LIKE '%paid%')")
        .first(),

      db('users')
        .count('* as count')
        .whereBetween('created_at', [
          new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
          startDate
        ])
        .whereRaw("(utm_source IS NULL OR utm_source NOT LIKE '%paid%')")
        .first()
    ]);

    const currentCount = parseInt(currentPeriod?.count as string || '0');
    const previousCount = parseInt(previousPeriod?.count as string || '0');

    return previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;
  }

  private async calculateChurnRate(startDate: Date, endDate: Date): Promise<number> {
    // Calculate churn as users who haven't been active in the last 30 days
    const [totalUsers, activeUsers] = await Promise.all([
      db('users')
        .count('* as count')
        .where('created_at', '<', endDate)
        .first(),

      db('analytics_events')
        .countDistinct('user_id as count')
        .whereBetween('created_at', [startDate, endDate])
        .first()
    ]);

    const total = parseInt(totalUsers?.count as string || '0');
    const active = parseInt(activeUsers?.count as string || '0');

    return total > 0 ? ((total - active) / total) * 100 : 0;
  }

  private async calculateActivationRate(startDate: Date, endDate: Date): Promise<number> {
    const [signups, activations] = await Promise.all([
      db('users')
        .count('* as count')
        .whereBetween('created_at', [startDate, endDate])
        .first(),

      db('conversion_events')
        .count('* as count')
        .where('event_type', 'activation')
        .whereBetween('created_at', [startDate, endDate])
        .first()
    ]);

    const signupCount = parseInt(signups?.count as string || '0');
    const activationCount = parseInt(activations?.count as string || '0');

    return signupCount > 0 ? (activationCount / signupCount) * 100 : 0;
  }

  private async calculateRetentionRates(startDate: Date, endDate: Date): Promise<{
    day_1: number;
    day_7: number;
    day_30: number;
    day_90: number;
  }> {
    // Users who signed up during the period
    const newUsers = await db('users')
      .select('id', 'created_at')
      .whereBetween('created_at', [startDate, endDate]);

    const retentionRates = {
      day_1: 0,
      day_7: 0,
      day_30: 0,
      day_90: 0
    };

    if (newUsers.length === 0) return retentionRates;

    // Calculate retention for each period
    for (const [period, days] of [['day_1', 1], ['day_7', 7], ['day_30', 30], ['day_90', 90]]) {
      let retainedCount = 0;

      for (const user of newUsers) {
        const retentionDate = new Date(user.created_at.getTime() + days * 24 * 60 * 60 * 1000);
        
        if (retentionDate > new Date()) continue; // Skip if retention date is in the future

        const activity = await db('analytics_events')
          .where('user_id', user.id)
          .whereBetween('created_at', [
            retentionDate,
            new Date(retentionDate.getTime() + 24 * 60 * 60 * 1000)
          ])
          .first();

        if (activity) retainedCount++;
      }

      retentionRates[period as keyof typeof retentionRates] = (retainedCount / newUsers.length) * 100;
    }

    return retentionRates;
  }

  private async calculateConversionRate(startDate: Date, endDate: Date): Promise<number> {
    const [visitors, conversions] = await Promise.all([
      db('conversion_events')
        .countDistinct('session_id as count')
        .where('event_type', 'page_view')
        .whereBetween('created_at', [startDate, endDate])
        .first(),

      db('conversion_events')
        .count('* as count')
        .where('event_type', 'conversion')
        .whereBetween('created_at', [startDate, endDate])
        .first()
    ]);

    const visitorCount = parseInt(visitors?.count as string || '0');
    const conversionCount = parseInt(conversions?.count as string || '0');

    return visitorCount > 0 ? (conversionCount / visitorCount) * 100 : 0;
  }

  private async calculateRetentionRate(startDate: Date, endDate: Date): Promise<number> {
    const activeUsers = await db('analytics_events')
      .countDistinct('user_id as count')
      .whereBetween('created_at', [startDate, endDate])
      .first();

    const totalUsers = await db('users')
      .count('* as count')
      .where('created_at', '<', endDate)
      .first();

    const active = parseInt(activeUsers?.count as string || '0');
    const total = parseInt(totalUsers?.count as string || '0');

    return total > 0 ? (active / total) * 100 : 0;
  }
}

export const growthAnalyticsService = new GrowthAnalyticsService();