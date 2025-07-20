import { apiClient } from './apiClient';
import {
  OnboardingProgress,
  UserOnboarding,
  TemplateRecommendation,
  TutorialStep,
  IndustryClassification,
  CompanyTypeClassification,
  UpdateProfileRequest,
  CompleteStepRequest,
  RateTemplateRequest
} from '../types/onboarding';

class OnboardingService {
  private baseUrl = '/onboarding';

  // Initialize onboarding for current user
  async initializeOnboarding(): Promise<UserOnboarding> {
    const response = await apiClient.post(`${this.baseUrl}/initialize`);
    return response.data.data;
  }

  // Get current user's onboarding progress
  async getProgress(): Promise<OnboardingProgress> {
    const response = await apiClient.get(`${this.baseUrl}/progress`);
    return response.data.data;
  }

  // Update user profile during onboarding
  async updateProfile(profileData: UpdateProfileRequest): Promise<UserOnboarding> {
    const response = await apiClient.put(`${this.baseUrl}/profile`, profileData);
    return response.data.data;
  }

  // Get personalized template recommendations
  async getTemplateRecommendations(limit: number = 10): Promise<TemplateRecommendation[]> {
    const response = await apiClient.get(`${this.baseUrl}/templates/recommendations`, {
      params: { limit }
    });
    return response.data.data;
  }

  // Get all tutorial steps
  async getTutorialSteps(category?: string): Promise<TutorialStep[]> {
    const response = await apiClient.get(`${this.baseUrl}/tutorial/steps`, {
      params: category ? { category } : {}
    });
    return response.data.data;
  }

  // Start a tutorial step
  async startTutorialStep(stepId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/tutorial/steps/${stepId}/start`);
  }

  // Complete a tutorial step
  async completeTutorialStep(stepId: string, timeSpentSeconds: number = 0): Promise<void> {
    const payload: CompleteStepRequest = {
      stepId,
      timeSpentSeconds
    };
    await apiClient.post(`${this.baseUrl}/tutorial/steps/${stepId}/complete`, payload);
  }

  // Mark first PRD as created
  async markFirstPRDCreated(): Promise<void> {
    await apiClient.post(`${this.baseUrl}/milestone/first-prd`);
  }

  // Mark team invitation as sent
  async markTeamInvitationSent(): Promise<void> {
    await apiClient.post(`${this.baseUrl}/milestone/team-invitation`);
  }

  // Get industry classifications
  async getIndustryClassifications(): Promise<IndustryClassification[]> {
    const response = await apiClient.get(`${this.baseUrl}/classifications/industries`);
    return response.data.data;
  }

  // Get company type classifications
  async getCompanyTypeClassifications(): Promise<CompanyTypeClassification[]> {
    const response = await apiClient.get(`${this.baseUrl}/classifications/company-types`);
    return response.data.data;
  }

  // Rate a template
  async rateTemplate(templateId: string, rating: number, review?: string): Promise<void> {
    const payload: RateTemplateRequest = {
      templateId,
      rating,
      review
    };
    await apiClient.post(`${this.baseUrl}/templates/${templateId}/rate`, payload);
  }

  // Skip onboarding
  async skipOnboarding(): Promise<void> {
    await apiClient.post(`${this.baseUrl}/skip`);
  }

  // Get onboarding analytics (admin only)
  async getOnboardingAnalytics(timeRange: string = '30d'): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/analytics`, {
      params: { timeRange }
    });
    return response.data.data;
  }

  // Helper methods for client-side logic
  getCompletionColor(percentage: number): string {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 70) return 'text-blue-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-gray-500';
  }

  getCompletionMessage(percentage: number): string {
    if (percentage >= 100) return 'Onboarding completed! 🎉';
    if (percentage >= 90) return 'Almost done!';
    if (percentage >= 70) return 'Great progress!';
    if (percentage >= 50) return 'Halfway there!';
    if (percentage >= 25) return 'Getting started...';
    return 'Welcome to PRD Creator!';
  }

  getNextStep(progress: OnboardingProgress): string | null {
    const { onboarding, tutorialSteps } = progress;
    
    if (!onboarding.welcome_completed) return 'welcome';
    if (!onboarding.profile_setup_completed) return 'profile-setup';
    if (!onboarding.first_prd_created) return 'first-prd';
    
    // Find first incomplete required tutorial step
    const incompleteStep = tutorialSteps.find(step => 
      step.is_required && !step.progress?.completed
    );
    
    if (incompleteStep) return incompleteStep.step_id;
    
    if (!onboarding.team_invitation_sent) return 'team-setup';
    
    return null; // Onboarding complete
  }

  isStepAccessible(stepId: string, progress: OnboardingProgress): boolean {
    const { onboarding, tutorialSteps } = progress;
    const step = tutorialSteps.find(s => s.step_id === stepId);
    
    if (!step) return false;
    
    // Check prerequisites
    return step.prerequisites.every(prereqId => {
      const prereqStep = tutorialSteps.find(s => s.step_id === prereqId);
      return prereqStep?.progress?.completed || false;
    });
  }

  calculateTimeRemaining(progress: OnboardingProgress): number {
    const { tutorialSteps } = progress;
    const incompleteSteps = tutorialSteps.filter(step => 
      step.is_required && !step.progress?.completed
    );
    
    return incompleteSteps.reduce((total, step) => 
      total + step.estimated_time_minutes, 0
    );
  }

  getRecommendationBadge(recommendation: TemplateRecommendation): string {
    if (recommendation.matchScore >= 8) return 'Perfect Match';
    if (recommendation.matchScore >= 6) return 'Great Fit';
    if (recommendation.matchScore >= 4) return 'Good Match';
    return 'Consider';
  }

  getRecommendationBadgeColor(recommendation: TemplateRecommendation): string {
    if (recommendation.matchScore >= 8) return 'bg-green-100 text-green-800';
    if (recommendation.matchScore >= 6) return 'bg-blue-100 text-blue-800';
    if (recommendation.matchScore >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }

  formatEstimatedTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  getDifficultyColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'basic':
        return 'text-green-600';
      case 'intermediate':
        return 'text-yellow-600';
      case 'advanced':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'feature':
        return '⚡';
      case 'product':
        return '🚀';
      case 'api':
        return '🔗';
      case 'mobile':
        return '📱';
      case 'web':
        return '🌐';
      default:
        return '📄';
    }
  }

  getIndustryIcon(industry: string): string {
    switch (industry) {
      case 'technology':
        return '💻';
      case 'healthcare':
        return '🏥';
      case 'finance':
        return '💰';
      case 'ecommerce':
        return '🛒';
      case 'education':
        return '🎓';
      case 'media':
        return '📺';
      default:
        return '🏢';
    }
  }

  getCompanyTypeIcon(companyType: string): string {
    switch (companyType) {
      case 'startup':
        return '🚀';
      case 'enterprise':
        return '🏢';
      case 'agency':
        return '🎯';
      case 'freelancer':
        return '👤';
      default:
        return '🔧';
    }
  }
}

export const onboardingService = new OnboardingService();