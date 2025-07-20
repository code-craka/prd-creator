import { db } from '../config/database';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailCampaign {
  id: string;
  name: string;
  type: 'onboarding' | 'activation' | 'retention' | 'newsletter' | 'promotional';
  trigger_event: string;
  subject_line: string;
  html_content: string;
  text_content: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  delay_hours: number;
  audience_filters: Record<string, any>;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  unsubscribed_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface EmailSequence {
  id: string;
  name: string;
  trigger_event: string;
  description: string;
  is_active: boolean;
  audience_filters: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface EmailSequenceStep {
  id: string;
  sequence_id: string;
  campaign_id: string;
  step_order: number;
  delay_hours: number;
  conditions: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface UserEmailStatus {
  user_id: string;
  email: string;
  is_subscribed: boolean;
  subscription_preferences: Record<string, boolean>;
  unsubscribed_at: Date | null;
  bounce_count: number;
  complaint_count: number;
  last_engagement: Date | null;
}

export interface EmailStats {
  campaign_id: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  complained_count: number;
  unsubscribed_count: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
}

class EmailMarketingService {
  // Create email campaign
  async createEmailCampaign(campaignData: {
    name: string;
    type: EmailCampaign['type'];
    trigger_event: string;
    subject_line: string;
    html_content: string;
    text_content: string;
    delay_hours?: number;
    audience_filters?: Record<string, any>;
  }): Promise<EmailCampaign> {
    const {
      name,
      type,
      trigger_event,
      subject_line,
      html_content,
      text_content,
      delay_hours = 0,
      audience_filters = {}
    } = campaignData;

    const campaign = await db('email_campaigns')
      .insert({
        name,
        type,
        trigger_event,
        subject_line,
        html_content,
        text_content,
        delay_hours,
        audience_filters: JSON.stringify(audience_filters),
        status: 'draft'
      })
      .returning('*');

    return {
      ...campaign[0],
      audience_filters: JSON.parse(campaign[0].audience_filters || '{}')
    };
  }

  // Create email sequence
  async createEmailSequence(sequenceData: {
    name: string;
    trigger_event: string;
    description: string;
    audience_filters?: Record<string, any>;
    steps: Array<{
      campaign_id: string;
      delay_hours: number;
      conditions?: Record<string, any>;
    }>;
  }): Promise<EmailSequence> {
    const {
      name,
      trigger_event,
      description,
      audience_filters = {},
      steps
    } = sequenceData;

    const sequence = await db('email_sequences')
      .insert({
        name,
        trigger_event,
        description,
        audience_filters: JSON.stringify(audience_filters),
        is_active: true
      })
      .returning('*');

    // Create sequence steps
    const sequenceSteps = await Promise.all(
      steps.map((step, index) =>
        db('email_sequence_steps').insert({
          sequence_id: sequence[0].id,
          campaign_id: step.campaign_id,
          step_order: index + 1,
          delay_hours: step.delay_hours,
          conditions: JSON.stringify(step.conditions || {})
        })
      )
    );

    return {
      ...sequence[0],
      audience_filters: JSON.parse(sequence[0].audience_filters || '{}')
    };
  }

  // Trigger email for specific event
  async triggerEmail(
    userId: string,
    event: string,
    eventData: Record<string, any> = {}
  ): Promise<void> {
    // Find active campaigns for this trigger event
    const campaigns = await db('email_campaigns')
      .where('trigger_event', event)
      .where('status', 'active');

    // Find active sequences for this trigger event
    const sequences = await db('email_sequences')
      .where('trigger_event', event)
      .where('is_active', true);

    // Process individual campaigns
    for (const campaign of campaigns) {
      await this.scheduleEmail(userId, campaign.id, eventData);
    }

    // Process sequences
    for (const sequence of sequences) {
      await this.scheduleEmailSequence(userId, sequence.id, eventData);
    }
  }

  // Send email campaign to user
  async sendEmail(
    userId: string,
    campaignId: string,
    personalizedData: Record<string, any> = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Get campaign details
      const campaign = await db('email_campaigns')
        .where('id', campaignId)
        .first();

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get user details
      const user = await db('users')
        .where('id', userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is subscribed
      const emailStatus = await this.getUserEmailStatus(userId);
      if (!emailStatus.is_subscribed) {
        return { success: false, error: 'User is unsubscribed' };
      }

      // Personalize content
      const personalizedSubject = this.personalizeContent(
        campaign.subject_line,
        { ...user, ...personalizedData }
      );
      const personalizedHtml = this.personalizeContent(
        campaign.html_content,
        { ...user, ...personalizedData }
      );
      const personalizedText = this.personalizeContent(
        campaign.text_content,
        { ...user, ...personalizedData }
      );

      // Send email via Resend
      const result = await resend.emails.send({
        from: 'PRD Creator <noreply@prdcreator.com>',
        to: user.email,
        subject: personalizedSubject,
        html: personalizedHtml,
        text: personalizedText,
        headers: {
          'X-Campaign-ID': campaignId,
          'X-User-ID': userId
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Update campaign stats
      await db('email_campaigns')
        .where('id', campaignId)
        .increment('sent_count', 1);

      // Track email sent event
      await this.trackEmailEvent(userId, campaignId, 'sent', {
        message_id: result.data?.id
      });

      return {
        success: true,
        messageId: result.data?.id
      };

    } catch (error: any) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process onboarding email sequence
  async processOnboardingSequence(userId: string): Promise<void> {
    const onboardingSequences = [
      {
        trigger: 'user_signup',
        delay: 0,
        type: 'welcome'
      },
      {
        trigger: 'profile_setup_completed',
        delay: 24,
        type: 'getting_started'
      },
      {
        trigger: 'first_prd_created',
        delay: 72,
        type: 'tips_and_tricks'
      },
      {
        trigger: 'no_activity_7_days',
        delay: 168,
        type: 'comeback'
      }
    ];

    // Schedule welcome email immediately
    await this.triggerEmail(userId, 'user_signup');
  }

  // Process activation email sequence
  async processActivationSequence(userId: string): Promise<void> {
    const user = await db('users').where('id', userId).first();
    if (!user) return;

    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Send activation emails based on user behavior
    if (daysSinceSignup === 1) {
      await this.triggerEmail(userId, 'day_1_activation');
    } else if (daysSinceSignup === 3) {
      await this.triggerEmail(userId, 'day_3_activation');
    } else if (daysSinceSignup === 7) {
      await this.triggerEmail(userId, 'day_7_activation');
    }
  }

  // Send weekly digest email
  async sendWeeklyDigest(userId: string): Promise<void> {
    // Get user's team analytics
    const userTeams = await db('team_members')
      .where('user_id', userId)
      .pluck('team_id');

    if (userTeams.length === 0) return;

    // Get weekly analytics for user's teams
    const weeklyStats = await db('team_analytics')
      .whereIn('team_id', userTeams)
      .where('date', '>=', db.raw("NOW() - INTERVAL '7 days'"))
      .select([
        db.raw('SUM(prds_created) as total_prds_created'),
        db.raw('SUM(prds_edited) as total_prds_edited'),
        db.raw('SUM(collaboration_events) as total_collaborations'),
        db.raw('COUNT(DISTINCT active_users) as active_team_members')
      ])
      .first();

    const digestData = {
      prds_created: weeklyStats?.total_prds_created || 0,
      prds_edited: weeklyStats?.total_prds_edited || 0,
      collaborations: weeklyStats?.total_collaborations || 0,
      active_members: weeklyStats?.active_team_members || 0
    };

    await this.triggerEmail(userId, 'weekly_digest', digestData);
  }

  // Track email events (opens, clicks, bounces, etc.)
  async trackEmailEvent(
    userId: string,
    campaignId: string,
    eventType: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    // Update campaign stats
    const updateField = `${eventType}_count`;
    await db('email_campaigns')
      .where('id', campaignId)
      .increment(updateField, 1);

    // Update user email status for engagement
    if (eventType === 'opened' || eventType === 'clicked') {
      await db('user_email_status')
        .where('user_id', userId)
        .update({ last_engagement: new Date() })
        .onConflict('user_id')
        .merge();
    }

    // Handle unsubscribes
    if (eventType === 'unsubscribed') {
      await this.unsubscribeUser(userId);
    }

    // Handle bounces and complaints
    if (eventType === 'bounced' || eventType === 'complained') {
      await db('user_email_status')
        .where('user_id', userId)
        .increment(`${eventType.replace('ed', '')}_count`, 1)
        .onConflict('user_id')
        .merge();
    }
  }

  // Get user email subscription status
  async getUserEmailStatus(userId: string): Promise<UserEmailStatus> {
    const user = await db('users').where('id', userId).first();
    if (!user) {
      throw new Error('User not found');
    }

    let emailStatus = await db('user_email_status')
      .where('user_id', userId)
      .first();

    if (!emailStatus) {
      // Create default email status
      emailStatus = await db('user_email_status')
        .insert({
          user_id: userId,
          email: user.email,
          is_subscribed: true,
          subscription_preferences: JSON.stringify({
            marketing: true,
            product_updates: true,
            weekly_digest: true,
            tips_and_tricks: true
          })
        })
        .returning('*');
      emailStatus = emailStatus[0];
    }

    return {
      ...emailStatus,
      subscription_preferences: JSON.parse(emailStatus.subscription_preferences || '{}')
    };
  }

  // Update email preferences
  async updateEmailPreferences(
    userId: string,
    preferences: Record<string, boolean>
  ): Promise<UserEmailStatus> {
    const emailStatus = await db('user_email_status')
      .where('user_id', userId)
      .update({
        subscription_preferences: JSON.stringify(preferences)
      })
      .returning('*');

    return {
      ...emailStatus[0],
      subscription_preferences: JSON.parse(emailStatus[0].subscription_preferences || '{}')
    };
  }

  // Unsubscribe user from all emails
  async unsubscribeUser(userId: string): Promise<void> {
    await db('user_email_status')
      .where('user_id', userId)
      .update({
        is_subscribed: false,
        unsubscribed_at: new Date()
      })
      .onConflict('user_id')
      .merge();
  }

  // Get email campaign performance
  async getCampaignStats(campaignId: string): Promise<EmailStats> {
    const campaign = await db('email_campaigns')
      .where('id', campaignId)
      .first();

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const stats = {
      campaign_id: campaignId,
      sent_count: campaign.sent_count,
      delivered_count: campaign.sent_count - (campaign.bounced_count || 0),
      opened_count: campaign.opened_count,
      clicked_count: campaign.clicked_count,
      bounced_count: campaign.bounced_count || 0,
      complained_count: campaign.complained_count || 0,
      unsubscribed_count: campaign.unsubscribed_count,
      open_rate: campaign.sent_count > 0 ? (campaign.opened_count / campaign.sent_count) * 100 : 0,
      click_rate: campaign.opened_count > 0 ? (campaign.clicked_count / campaign.opened_count) * 100 : 0,
      bounce_rate: campaign.sent_count > 0 ? ((campaign.bounced_count || 0) / campaign.sent_count) * 100 : 0,
      unsubscribe_rate: campaign.sent_count > 0 ? (campaign.unsubscribed_count / campaign.sent_count) * 100 : 0
    };

    return stats;
  }

  // Get email marketing analytics
  async getEmailAnalytics(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<{
    total_campaigns: number;
    total_sent: number;
    total_opened: number;
    total_clicked: number;
    overall_open_rate: number;
    overall_click_rate: number;
    top_campaigns: Array<{
      name: string;
      sent_count: number;
      open_rate: number;
      click_rate: number;
    }>;
    subscriber_growth: Array<{
      date: string;
      new_subscribers: number;
      unsubscribes: number;
      net_growth: number;
    }>;
  }> {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    const [campaignStats, topCampaigns, subscriberGrowth] = await Promise.all([
      // Overall statistics
      db('email_campaigns')
        .whereBetween('created_at', [startDate, new Date()])
        .select([
          db.raw('COUNT(*) as total_campaigns'),
          db.raw('SUM(sent_count) as total_sent'),
          db.raw('SUM(opened_count) as total_opened'),
          db.raw('SUM(clicked_count) as total_clicked')
        ])
        .first(),

      // Top performing campaigns
      db('email_campaigns')
        .whereBetween('created_at', [startDate, new Date()])
        .where('sent_count', '>', 0)
        .select([
          'name',
          'sent_count',
          'opened_count',
          'clicked_count'
        ])
        .orderBy('sent_count', 'desc')
        .limit(10),

      // Subscriber growth by day
      db('user_email_status')
        .select([
          db.raw('DATE(created_at) as date'),
          db.raw('COUNT(*) as new_subscribers'),
          db.raw(`COUNT(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 END) as unsubscribes`)
        ])
        .whereBetween('created_at', [startDate, new Date()])
        .groupBy(db.raw('DATE(created_at)'))
        .orderBy('date')
    ]);

    const totalSent = parseInt(campaignStats?.total_sent || '0');
    const totalOpened = parseInt(campaignStats?.total_opened || '0');
    const totalClicked = parseInt(campaignStats?.total_clicked || '0');

    return {
      total_campaigns: parseInt(campaignStats?.total_campaigns || '0'),
      total_sent: totalSent,
      total_opened: totalOpened,
      total_clicked: totalClicked,
      overall_open_rate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      overall_click_rate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
      top_campaigns: topCampaigns.map(campaign => ({
        name: campaign.name,
        sent_count: campaign.sent_count,
        open_rate: campaign.sent_count > 0 ? (campaign.opened_count / campaign.sent_count) * 100 : 0,
        click_rate: campaign.opened_count > 0 ? (campaign.clicked_count / campaign.opened_count) * 100 : 0
      })),
      subscriber_growth: subscriberGrowth.map(day => ({
        date: day.date,
        new_subscribers: parseInt(day.new_subscribers),
        unsubscribes: parseInt(day.unsubscribes),
        net_growth: parseInt(day.new_subscribers) - parseInt(day.unsubscribes)
      }))
    };
  }

  // Private helper methods
  private async scheduleEmail(
    userId: string,
    campaignId: string,
    eventData: Record<string, any>
  ): Promise<void> {
    const campaign = await db('email_campaigns')
      .where('id', campaignId)
      .first();

    if (!campaign) return;

    // Check audience filters
    if (!await this.userMatchesFilters(userId, JSON.parse(campaign.audience_filters || '{}'))) {
      return;
    }

    // Schedule email with delay
    if (campaign.delay_hours > 0) {
      // In production, use a job queue like Bull or Agenda
      setTimeout(() => {
        this.sendEmail(userId, campaignId, eventData);
      }, campaign.delay_hours * 60 * 60 * 1000);
    } else {
      await this.sendEmail(userId, campaignId, eventData);
    }
  }

  private async scheduleEmailSequence(
    userId: string,
    sequenceId: string,
    eventData: Record<string, any>
  ): Promise<void> {
    const sequence = await db('email_sequences')
      .where('id', sequenceId)
      .first();

    if (!sequence) return;

    // Check audience filters
    if (!await this.userMatchesFilters(userId, JSON.parse(sequence.audience_filters || '{}'))) {
      return;
    }

    // Get sequence steps
    const steps = await db('email_sequence_steps')
      .where('sequence_id', sequenceId)
      .orderBy('step_order');

    // Schedule each step
    for (const step of steps) {
      // Check step conditions
      if (await this.userMatchesConditions(userId, JSON.parse(step.conditions || '{}'))) {
        setTimeout(() => {
          this.sendEmail(userId, step.campaign_id, eventData);
        }, step.delay_hours * 60 * 60 * 1000);
      }
    }
  }

  private async userMatchesFilters(
    userId: string,
    filters: Record<string, any>
  ): Promise<boolean> {
    // Implement audience filtering logic
    // Example filters: user_type, subscription_status, activity_level, etc.
    return true; // Simplified for now
  }

  private async userMatchesConditions(
    userId: string,
    conditions: Record<string, any>
  ): Promise<boolean> {
    // Implement condition checking logic
    // Example conditions: has_created_prd, team_member, etc.
    return true; // Simplified for now
  }

  private personalizeContent(
    content: string,
    userData: Record<string, any>
  ): string {
    let personalizedContent = content;

    // Replace placeholders with user data
    Object.keys(userData).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      personalizedContent = personalizedContent.replace(placeholder, userData[key] || '');
    });

    return personalizedContent;
  }
}

export const emailMarketingService = new EmailMarketingService();