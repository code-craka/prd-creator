import { useState, useEffect, useCallback } from 'react';
import { onboardingService } from '../services/onboardingService';
import {
  OnboardingProgress,
  TemplateRecommendation,
  IndustryClassification,
  CompanyTypeClassification,
  UpdateOnboardingProfileRequest,
  OnboardingState,
  OnboardingActions,
  TutorialStep
} from 'prd-creator-shared';

interface UseOnboardingReturn extends OnboardingState, OnboardingActions {
  // Helper methods
  markFirstPRDCreated: () => Promise<void>;
  markTeamInvitationSent: () => Promise<void>;
  isOnboardingComplete: () => boolean;
  shouldShowOnboarding: () => boolean;
  getCompletionPercentage: () => number;
  getTimeRemaining: () => number;
  isStepAccessible: (stepId: string) => boolean;
  getNextStep: () => string | null;
  clearError: () => void;
  
  // Reload methods
  loadProgress: () => Promise<void>;
  loadClassifications: () => Promise<void>;
}

export const useOnboarding = (autoLoad: boolean = true): UseOnboardingReturn => {
  const [state, setState] = useState<OnboardingState>({
    progress: null,
    isLoading: false,
    error: null,
    currentStep: null,
    recommendations: [],
    industries: [],
    companyTypes: []
  });

  // Load onboarding progress
  const loadProgress = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const progress = await onboardingService.getProgress();
      const currentStep = onboardingService.getNextStep(progress);
      
      setState(prev => ({
        ...prev,
        progress,
        currentStep,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load onboarding progress',
        isLoading: false
      }));
    }
  }, []);

  // Initialize onboarding
  const initializeOnboarding = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await onboardingService.initializeOnboarding();
      await loadProgress();
    } catch (error) {
      console.error('Failed to initialize onboarding:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize onboarding',
        isLoading: false
      }));
    }
  }, [loadProgress]);

  // Update user profile
  const updateProfile = useCallback(async (profileData: UpdateOnboardingProfileRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await onboardingService.updateProfile(profileData);
      await loadProgress();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to update profile',
        isLoading: false
      }));
      throw error;
    }
  }, [loadProgress]);

  // Start a tutorial step
  const startStep = useCallback(async (stepId: string) => {
    try {
      await onboardingService.startTutorialStep(stepId);
      setState(prev => ({ ...prev, currentStep: stepId }));
    } catch (error) {
      console.error('Failed to start tutorial step:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to start tutorial step'
      }));
    }
  }, []);

  // Complete a tutorial step
  const completeStep = useCallback(async (stepId: string, timeSpent: number = 0) => {
    try {
      await onboardingService.completeTutorialStep(stepId, timeSpent);
      await loadProgress();
    } catch (error) {
      console.error('Failed to complete tutorial step:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to complete tutorial step'
      }));
      throw error;
    }
  }, [loadProgress]);

  // Skip onboarding
  const skipOnboarding = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await onboardingService.skipOnboarding();
      await loadProgress();
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to skip onboarding',
        isLoading: false
      }));
    }
  }, [loadProgress]);

  // Load template recommendations
  const loadRecommendations = useCallback(async () => {
    try {
      const recommendations = await onboardingService.getTemplateRecommendations();
      setState(prev => ({
        ...prev,
        recommendations
      }));
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load recommendations'
      }));
    }
  }, []);

  // Rate a template
  const rateTemplate = useCallback(async (templateId: string, rating: number, review?: string) => {
    try {
      await onboardingService.rateTemplate(templateId, rating, review);
      // Optionally reload recommendations to reflect updated ratings
      await loadRecommendations();
    } catch (error) {
      console.error('Failed to rate template:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to rate template'
      }));
    }
  }, [loadRecommendations]);

  // Load classifications
  const loadClassifications = useCallback(async () => {
    try {
      const [industries, companyTypes] = await Promise.all([
        onboardingService.getIndustryClassifications(),
        onboardingService.getCompanyTypeClassifications()
      ]);

      setState(prev => ({
        ...prev,
        industries,
        companyTypes
      }));
    } catch (error) {
      console.error('Failed to load classifications:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load classifications'
      }));
    }
  }, []);

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad) {
      loadProgress();
      loadClassifications();
    }
  }, [autoLoad, loadProgress, loadClassifications]);

  // Mark milestones (to be called from other components)
  const markFirstPRDCreated = useCallback(async () => {
    try {
      await onboardingService.markFirstPRDCreated();
      await loadProgress();
    } catch (error) {
      console.error('Failed to mark first PRD created:', error);
    }
  }, [loadProgress]);

  const markTeamInvitationSent = useCallback(async () => {
    try {
      await onboardingService.markTeamInvitationSent();
      await loadProgress();
    } catch (error) {
      console.error('Failed to mark team invitation sent:', error);
    }
  }, [loadProgress]);

  // Helper methods
  const isOnboardingComplete = useCallback(() => {
    return state.progress?.onboarding.completion_percentage === 100;
  }, [state.progress]);

  const shouldShowOnboarding = useCallback(() => {
    if (!state.progress) return false;
    return state.progress.onboarding.completion_percentage < 100;
  }, [state.progress]);

  const getCompletionPercentage = useCallback(() => {
    return state.progress?.onboarding.completion_percentage || 0;
  }, [state.progress]);

  const getTimeRemaining = useCallback(() => {
    if (!state.progress) return 0;
    return onboardingService.calculateTimeRemaining(state.progress);
  }, [state.progress]);

  const isStepAccessible = useCallback((stepId: string) => {
    if (!state.progress) return false;
    return onboardingService.isStepAccessible(stepId, state.progress);
  }, [state.progress]);

  const getNextStep = useCallback(() => {
    if (!state.progress) return null;
    return onboardingService.getNextStep(state.progress);
  }, [state.progress]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    initializeOnboarding,
    updateProfile,
    startStep,
    completeStep,
    skipOnboarding,
    loadRecommendations,
    rateTemplate,
    
    // Helper methods
    markFirstPRDCreated,
    markTeamInvitationSent,
    isOnboardingComplete,
    shouldShowOnboarding,
    getCompletionPercentage,
    getTimeRemaining,
    isStepAccessible,
    getNextStep,
    clearError,
    
    // Reload methods
    loadProgress,
    loadClassifications
  };
};

// Hook for template recommendations specifically
export const useTemplateRecommendations = () => {
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async (limit?: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await onboardingService.getTemplateRecommendations(limit);
      setRecommendations(data);
    } catch (err) {
      console.error('Failed to load template recommendations:', err);
      setError('Failed to load template recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return {
    recommendations,
    loading,
    error,
    reload: loadRecommendations
  };
};

// Hook for tutorial management
export const useTutorial = (category?: string) => {
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const loadSteps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await onboardingService.getTutorialSteps(category);
      setSteps(data);
    } catch (err) {
      console.error('Failed to load tutorial steps:', err);
      setError('Failed to load tutorial steps');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadSteps();
  }, [loadSteps]);

  const currentStep = steps[currentStepIndex] || null;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const goToNextStep = useCallback(() => {
    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [isLastStep]);

  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [isFirstStep]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  }, [steps.length]);

  return {
    steps,
    loading,
    error,
    currentStep,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    reload: loadSteps
  };
};