import React, { useState } from 'react';
import { 
  PlayCircle, 
  Settings, 
  Users, 
  FileText, 
  BookOpen,
  Star,
  Clock,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { useOnboarding, useTemplateRecommendations } from '../../hooks/useOnboarding';
import { onboardingService } from '../../services/onboardingService';
import ProgressIndicator from './ProgressIndicator';
import OnboardingWizard from './OnboardingWizard';

const OnboardingDashboard: React.FC = () => {
  const {
    progress,
    isLoading,
    error,
    shouldShowOnboarding,
    getCompletionPercentage,
    getNextStep,
    loadProgress
  } = useOnboarding();

  const {
    recommendations,
    loading: recommendationsLoading
  } = useTemplateRecommendations();

  const [showWizard, setShowWizard] = useState(false);

  const handleCompleteOnboarding = () => {
    setShowWizard(false);
    loadProgress();
  };

  const handleResumeOnboarding = () => {
    setShowWizard(true);
  };

  const getQuickActions = () => {
    if (!progress) return [];

    const actions = [];
    const { onboarding } = progress;

    if (!onboarding.profile_setup_completed) {
      actions.push({
        id: 'complete-profile',
        title: 'Complete Your Profile',
        description: 'Help us personalize your experience',
        icon: Settings,
        color: 'purple',
        action: () => setShowWizard(true)
      });
    }

    if (!onboarding.first_prd_created) {
      actions.push({
        id: 'create-first-prd',
        title: 'Create Your First PRD',
        description: 'Start with AI assistance or a template',
        icon: FileText,
        color: 'blue',
        action: () => {/* Navigate to PRD creation */}
      });
    }

    if (!onboarding.tutorial_completed) {
      actions.push({
        id: 'complete-tutorial',
        title: 'Complete Tutorial',
        description: 'Learn PRD Creator essentials',
        icon: BookOpen,
        color: 'green',
        action: () => setShowWizard(true)
      });
    }

    if (!onboarding.team_invitation_sent) {
      actions.push({
        id: 'invite-team',
        title: 'Invite Your Team',
        description: 'Collaborate with colleagues',
        icon: Users,
        color: 'orange',
        action: () => {/* Navigate to team settings */}
      });
    }

    return actions;
  };

  if (showWizard) {
    return (
      <OnboardingWizard
        onComplete={handleCompleteOnboarding}
        onSkip={handleCompleteOnboarding}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-white mb-2">Unable to load onboarding</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={loadProgress}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!progress || !shouldShowOnboarding()) {
    return null; // User has completed onboarding
  }

  const completionPercentage = getCompletionPercentage();
  const nextStep = getNextStep();
  const quickActions = getQuickActions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to PRD Creator
            </h1>
            <p className="text-gray-300">
              Let's get your workspace set up for success
            </p>
          </div>
          
          <button
            onClick={handleResumeOnboarding}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <PlayCircle className="h-4 w-4" />
            <span>Resume Setup</span>
          </button>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <ProgressIndicator progress={progress} />
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Completion Status */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${onboardingService.getCompletionColor(completionPercentage)}`}>
                    {completionPercentage}%
                  </div>
                  <div className="text-xs text-gray-400">Complete</div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <p className={`text-sm ${onboardingService.getCompletionColor(completionPercentage)}`}>
                {onboardingService.getCompletionMessage(completionPercentage)}
              </p>
            </div>

            {/* Time Estimate */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Time Remaining</h3>
              </div>
              <div className="text-2xl font-bold text-blue-400 mb-1">
                ~{onboardingService.calculateTimeRemaining(progress)} min
              </div>
              <p className="text-sm text-gray-400">
                To complete setup
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Next Steps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                const colorClasses = {
                  purple: 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20',
                  blue: 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20',
                  green: 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20',
                  orange: 'border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20'
                };
                
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`p-4 border rounded-xl text-left transition-all group ${colorClasses[action.color as keyof typeof colorClasses]}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <IconComponent className="h-6 w-6 text-white" />
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {action.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Template Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Recommended Templates
              </h2>
              <span className="text-sm text-gray-400">
                Based on your profile
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.slice(0, 6).map((recommendation) => {
                const { template } = recommendation;
                
                return (
                  <div
                    key={template.id}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/30 transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {onboardingService.getCategoryIcon(template.category)}
                        </span>
                        {template.is_featured && (
                          <Star className="h-4 w-4 text-yellow-400" />
                        )}
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        onboardingService.getRecommendationBadgeColor(recommendation)
                      }`}>
                        {onboardingService.getRecommendationBadge(recommendation)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{onboardingService.formatEstimatedTime(recommendation.estimatedTimeToComplete)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{template.usage_count} teams</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Need Help Getting Started?
              </h3>
              <p className="text-gray-300 text-sm">
                Watch our quick tutorial or browse the help center for guides and tips.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors">
                Help Center
              </button>
              <button 
                onClick={handleResumeOnboarding}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restart Setup</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingDashboard;