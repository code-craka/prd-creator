import { db } from '../config/database';
import { 
  UserOnboarding, 
  PRDTemplate, 
  TutorialStep, 
  OnboardingProgress, 
  TemplateRecommendation,
  IndustryClassification,
  CompanyTypeClassification,
  OnboardingAnalytics
} from 'prd-creator-shared';

export class OnboardingService {
  // Initialize onboarding for a new user
  async initializeUserOnboarding(userId: string): Promise<UserOnboarding> {
    const existingOnboarding = await db('user_onboarding')
      .where('user_id', userId)
      .first();

    if (existingOnboarding) {
      return existingOnboarding;
    }

    const onboarding = await db('user_onboarding')
      .insert({
        user_id: userId,
        tutorial_progress: {},
        preferences: {},
        completion_percentage: 0,
        started_at: new Date()
      })
      .returning('*');

    // Track onboarding start
    await this.trackOnboardingEvent(userId, 'onboarding_started', 'onboarding', {});

    return onboarding[0];
  }

  // Get user onboarding progress
  async getUserOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    const onboarding = await db('user_onboarding')
      .where('user_id', userId)
      .first();

    if (!onboarding) {
      throw new Error('Onboarding not initialized for user');
    }

    const tutorialSteps = await this.getTutorialSteps();
    const userProgress = await db('user_tutorial_progress')
      .where('user_id', userId)
      .select('*');

    const progressMap = new Map(
      userProgress.map(p => [p.step_id, p])
    );

    const stepsWithProgress = tutorialSteps.map(step => ({
      ...step,
      progress: progressMap.get(step.id) || null
    }));

    return {
      onboarding,
      tutorialSteps: stepsWithProgress,
      completedSteps: userProgress.filter(p => p.completed).length,
      totalSteps: tutorialSteps.length,
      overallProgress: this.calculateOverallProgress(onboarding, userProgress, tutorialSteps)
    };
  }

  // Update user profile during onboarding
  async updateUserProfile(userId: string, profileData: {
    companyType?: string;
    industry?: string;
    teamSize?: string;
    experienceLevel?: string;
    preferences?: any;
  }): Promise<UserOnboarding> {
    const updateData: any = {
      updated_at: new Date()
    };

    if (profileData.companyType) updateData.company_type = profileData.companyType;
    if (profileData.industry) updateData.industry = profileData.industry;
    if (profileData.teamSize) updateData.team_size = profileData.teamSize;
    if (profileData.experienceLevel) updateData.experience_level = profileData.experienceLevel;
    if (profileData.preferences) updateData.preferences = profileData.preferences;

    // Mark profile setup as completed
    updateData.profile_setup_completed = true;

    const updated = await db('user_onboarding')
      .where('user_id', userId)
      .update(updateData)
      .returning('*');

    // Recalculate completion percentage
    await this.updateCompletionPercentage(userId);

    // Track profile completion
    await this.trackOnboardingEvent(userId, 'profile_completed', 'onboarding', profileData);

    return updated[0];
  }

  // Get personalized template recommendations
  async getTemplateRecommendations(userId: string, limit: number = 10): Promise<TemplateRecommendation[]> {
    const onboarding = await db('user_onboarding')
      .where('user_id', userId)
      .first();

    const baseQuery = db('prd_templates')
      .where('is_active', true)
      .orderBy('rating', 'desc')
      .orderBy('usage_count', 'desc');

    // Filter by user's industry and company type if available
    if (onboarding?.industry) {
      baseQuery.where('industry', onboarding.industry);
    }
    if (onboarding?.company_type) {
      baseQuery.where('company_type', onboarding.company_type);
    }

    const templates = await baseQuery.limit(limit);

    // Get user's experience level to adjust complexity
    const experienceLevel = onboarding?.experience_level;
    let recommendedComplexity = 'basic';
    
    if (experienceLevel === 'intermediate') recommendedComplexity = 'intermediate';
    else if (experienceLevel === 'expert') recommendedComplexity = 'advanced';

    // Enhance templates with recommendation reasons
    const recommendations: TemplateRecommendation[] = templates.map(template => {
      const reasons = [];
      let matchScore = 0;

      if (template.industry === onboarding?.industry) {
        reasons.push(`Perfect for ${template.industry} industry`);
        matchScore += 3;
      }

      if (template.company_type === onboarding?.company_type) {
        reasons.push(`Designed for ${template.company_type} companies`);
        matchScore += 2;
      }

      if (template.complexity_level === recommendedComplexity) {
        reasons.push(`Matches your experience level`);
        matchScore += 2;
      }

      if (template.is_featured) {
        reasons.push('Featured template');
        matchScore += 1;
      }

      if (template.rating >= 4.0) {
        reasons.push(`Highly rated (${template.rating}/5)`);
        matchScore += 1;
      }

      return {
        template,
        matchScore,
        recommendationReasons: reasons,
        estimatedTimeToComplete: this.estimateCompletionTime(template, experienceLevel)
      };
    });

    // Sort by match score
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }

  // Get all tutorial steps
  async getTutorialSteps(category?: string): Promise<TutorialStep[]> {
    const query = db('tutorial_steps')
      .where('is_active', true)
      .orderBy('order_index');

    if (category) {
      query.where('category', category);
    }

    return await query;
  }

  // Start a tutorial step
  async startTutorialStep(userId: string, stepId: string): Promise<void> {
    // Check if progress already exists
    const existingProgress = await db('user_tutorial_progress')
      .where({ user_id: userId, step_id: stepId })
      .first();

    if (!existingProgress) {
      await db('user_tutorial_progress').insert({
        user_id: userId,
        step_id: stepId,
        started_at: new Date()
      });
    }

    // Track step start
    await this.trackOnboardingEvent(userId, 'step_started', 'tutorial', { stepId });
  }

  // Complete a tutorial step
  async completeTutorialStep(userId: string, stepId: string, timeSpentSeconds: number = 0): Promise<void> {
    await db('user_tutorial_progress')
      .where({ user_id: userId, step_id: stepId })
      .update({
        completed: true,
        completed_at: new Date(),
        time_spent_seconds: timeSpentSeconds,
        updated_at: new Date()
      });

    // Update tutorial progress in user_onboarding
    const onboarding = await db('user_onboarding')
      .where('user_id', userId)
      .first();

    const tutorialProgress = onboarding?.tutorial_progress || {};
    tutorialProgress[stepId] = true;

    await db('user_onboarding')
      .where('user_id', userId)
      .update({
        tutorial_progress: tutorialProgress,
        updated_at: new Date()
      });

    // Check if all required tutorials are completed
    const allSteps = await this.getTutorialSteps();
    const requiredSteps = allSteps.filter(step => step.is_required);
    const completedCount = Object.keys(tutorialProgress).length;

    if (completedCount >= requiredSteps.length) {
      await db('user_onboarding')
        .where('user_id', userId)
        .update({
          tutorial_completed: true,
          updated_at: new Date()
        });
    }

    // Recalculate completion percentage
    await this.updateCompletionPercentage(userId);

    // Track step completion
    await this.trackOnboardingEvent(userId, 'step_completed', 'tutorial', { 
      stepId, 
      timeSpentSeconds 
    });
  }

  // Mark first PRD as created
  async markFirstPRDCreated(userId: string): Promise<void> {
    await db('user_onboarding')
      .where('user_id', userId)
      .update({
        first_prd_created: true,
        updated_at: new Date()
      });

    await this.updateCompletionPercentage(userId);
    await this.trackOnboardingEvent(userId, 'first_prd_created', 'onboarding', {});
  }

  // Mark team invitation as sent
  async markTeamInvitationSent(userId: string): Promise<void> {
    await db('user_onboarding')
      .where('user_id', userId)
      .update({
        team_invitation_sent: true,
        updated_at: new Date()
      });

    await this.updateCompletionPercentage(userId);
    await this.trackOnboardingEvent(userId, 'team_invitation_sent', 'onboarding', {});
  }

  // Get industry classifications
  async getIndustryClassifications(): Promise<IndustryClassification[]> {
    return await db('industry_classifications')
      .where('is_active', true)
      .orderBy('sort_order')
      .orderBy('industry_name');
  }

  // Get company type classifications
  async getCompanyTypeClassifications(): Promise<CompanyTypeClassification[]> {
    return await db('company_type_classifications')
      .where('is_active', true)
      .orderBy('sort_order')
      .orderBy('type_name');
  }

  // Rate a template
  async rateTemplate(userId: string, templateId: string, rating: number, review?: string): Promise<void> {
    // Insert or update rating
    await db('template_ratings')
      .insert({
        template_id: templateId,
        user_id: userId,
        rating,
        review
      })
      .onConflict(['template_id', 'user_id'])
      .merge(['rating', 'review', 'updated_at']);

    // Update template rating statistics
    await this.updateTemplateRating(templateId);
  }

  // Get onboarding analytics
  async getOnboardingAnalytics(timeRange: string = '30d'): Promise<any> {
    const startDate = this.getStartDateForRange(timeRange);
    
    const [totalUsers, completedUsers, avgCompletionTime, stepAnalytics] = await Promise.all([
      // Total users who started onboarding
      db('user_onboarding')
        .where('started_at', '>=', startDate)
        .count('* as count')
        .first(),

      // Users who completed onboarding
      db('user_onboarding')
        .where('started_at', '>=', startDate)
        .where('completion_percentage', '>=', 90)
        .count('* as count')
        .first(),

      // Average completion time
      db('user_onboarding')
        .where('completed_at', '>=', startDate)
        .whereNotNull('completed_at')
        .avg(db.raw('EXTRACT(EPOCH FROM (completed_at - started_at))'))
        .first(),

      // Step completion analytics
      db('onboarding_analytics')
        .where('created_at', '>=', startDate)
        .where('event_type', 'step_completed')
        .select('step_id')
        .count('* as completions')
        .groupBy('step_id')
    ]);

    return {
      totalUsers: parseInt(String(totalUsers?.count || '0')),
      completedUsers: parseInt(String(completedUsers?.count || '0')),
      completionRate: totalUsers?.count ? (Number(completedUsers?.count || 0) / Number(totalUsers?.count)) * 100 : 0,
      avgCompletionTimeHours: avgCompletionTime ? parseFloat(String((avgCompletionTime as any).avg)) / 3600 : 0,
      stepAnalytics
    };
  }

  // Private helper methods
  private calculateOverallProgress(
    onboarding: UserOnboarding, 
    userProgress: any[], 
    tutorialSteps: TutorialStep[]
  ): number {
    let progress = 0;
    const weights = {
      welcome: 10,
      profile: 25,
      tutorial: 40,
      firstPrd: 20,
      teamInvitation: 5
    };

    if (onboarding.welcome_completed) progress += weights.welcome;
    if (onboarding.profile_setup_completed) progress += weights.profile;
    if (onboarding.first_prd_created) progress += weights.firstPrd;
    if (onboarding.team_invitation_sent) progress += weights.teamInvitation;

    // Calculate tutorial progress
    const completedTutorials = userProgress.filter(p => p.completed).length;
    const totalTutorials = tutorialSteps.filter(s => s.is_required).length;
    const tutorialProgress = totalTutorials > 0 ? (completedTutorials / totalTutorials) : 0;
    progress += weights.tutorial * tutorialProgress;

    return Math.round(progress);
  }

  private async updateCompletionPercentage(userId: string): Promise<void> {
    const progress = await this.getUserOnboardingProgress(userId);
    const percentage = progress.overallProgress;

    await db('user_onboarding')
      .where('user_id', userId)
      .update({
        completion_percentage: percentage,
        completed_at: percentage >= 100 ? new Date() : null,
        updated_at: new Date()
      });
  }

  private estimateCompletionTime(template: PRDTemplate, experienceLevel?: string): number {
    let baseTime = 30; // 30 minutes base

    // Adjust for complexity
    if (template.complexity_level === 'intermediate') baseTime *= 1.5;
    else if (template.complexity_level === 'advanced') baseTime *= 2;

    // Adjust for experience
    if (experienceLevel === 'expert') baseTime *= 0.7;
    else if (experienceLevel === 'beginner') baseTime *= 1.3;

    return Math.round(baseTime);
  }

  private async updateTemplateRating(templateId: string): Promise<void> {
    const stats = await db('template_ratings')
      .where('template_id', templateId)
      .avg('rating as avg_rating')
      .count('* as rating_count')
      .first();

    await db('prd_templates')
      .where('id', templateId)
      .update({
        rating: parseFloat(stats?.avg_rating || '0'),
        rating_count: parseInt(stats?.rating_count || '0'),
        updated_at: new Date()
      });
  }

  private async trackOnboardingEvent(
    userId: string, 
    eventType: string, 
    eventCategory: string, 
    eventData: any
  ): Promise<void> {
    await db('onboarding_analytics').insert({
      user_id: userId,
      event_type: eventType,
      event_category: eventCategory,
      event_data: eventData,
      created_at: new Date()
    });
  }

  private getStartDateForRange(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

export const onboardingService = new OnboardingService();