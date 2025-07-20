import React from 'react';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  User, 
  FileText, 
  Users,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { onboardingService } from '../../services/onboardingService';
import { ProgressIndicatorProps } from '../../types/onboarding';

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  progress, 
  className = '' 
}) => {
  const { onboarding, tutorialSteps, completedSteps, totalSteps } = progress;
  const completionPercentage = onboarding.completion_percentage;

  const milestones = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Getting started',
      icon: Sparkles,
      completed: onboarding.welcome_completed,
      weight: 10
    },
    {
      id: 'profile',
      title: 'Profile Setup',
      description: 'Company & industry info',
      icon: User,
      completed: onboarding.profile_setup_completed,
      weight: 25
    },
    {
      id: 'first-prd',
      title: 'First PRD',
      description: 'Create your first document',
      icon: FileText,
      completed: onboarding.first_prd_created,
      weight: 20
    },
    {
      id: 'tutorial',
      title: 'Tutorial',
      description: `${completedSteps}/${totalSteps} steps`,
      icon: BookOpen,
      completed: onboarding.tutorial_completed,
      weight: 40
    },
    {
      id: 'team',
      title: 'Team Setup',
      description: 'Invite team members',
      icon: Users,
      completed: onboarding.team_invitation_sent,
      weight: 5
    }
  ];

  const getStepStatus = (milestone: typeof milestones[0]) => {
    if (milestone.completed) return 'completed';
    
    // Check if this is the current step based on progress
    const nextStep = onboardingService.getNextStep(progress);
    if (
      (nextStep === 'welcome' && milestone.id === 'welcome') ||
      (nextStep === 'profile-setup' && milestone.id === 'profile') ||
      (nextStep === 'first-prd' && milestone.id === 'first-prd') ||
      (nextStep?.includes('tutorial') && milestone.id === 'tutorial') ||
      (nextStep === 'team-setup' && milestone.id === 'team')
    ) {
      return 'current';
    }
    
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'current':
        return 'text-purple-400 bg-purple-400/20 border-purple-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (milestone: typeof milestones[0], status: string) => {
    const IconComponent = milestone.icon;
    
    if (status === 'completed') {
      return <CheckCircle className="h-5 w-5" />;
    }
    
    if (status === 'current') {
      return <IconComponent className="h-5 w-5 animate-pulse" />;
    }
    
    return <Circle className="h-5 w-5" />;
  };

  return (
    <div className={className}>
      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">
            Setup Progress
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">
              {completionPercentage}% complete
            </span>
            <span className={`text-sm ${onboardingService.getCompletionColor(completionPercentage)}`}>
              {onboardingService.getCompletionMessage(completionPercentage)}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          >
            <div className="h-full bg-white/20 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        {milestones.map((milestone) => {
          const status = getStepStatus(milestone);
          const statusColor = getStatusColor(status);
          
          return (
            <div
              key={milestone.id}
              className={`flex items-center space-x-4 p-4 rounded-lg border transition-all ${statusColor}`}
            >
              <div className="flex-shrink-0">
                {getStatusIcon(milestone, status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">
                    {milestone.title}
                  </h4>
                  <div className="text-xs text-gray-400">
                    {milestone.weight}% of total
                  </div>
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  {milestone.description}
                </p>
              </div>
              
              {status === 'completed' && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              )}
              
              {status === 'current' && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tutorial Progress Detail */}
      {tutorialSteps.length > 0 && (
        <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Tutorial Progress
            </h4>
            <span className="text-xs text-gray-400">
              {completedSteps}/{totalSteps} steps
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {tutorialSteps.slice(0, 8).map((step) => (
              <div
                key={step.id}
                className={`p-2 rounded text-center text-xs transition-all ${
                  step.progress?.completed
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                }`}
              >
                <div className="truncate" title={step.title}>
                  {step.title}
                </div>
                {step.progress?.completed && (
                  <CheckCircle className="h-3 w-3 mx-auto mt-1" />
                )}
              </div>
            ))}
          </div>
          
          {tutorialSteps.length > 8 && (
            <div className="text-center mt-2">
              <span className="text-xs text-gray-400">
                +{tutorialSteps.length - 8} more steps
              </span>
            </div>
          )}
        </div>
      )}

      {/* Time Estimate */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
          <Clock className="h-4 w-4 text-blue-400" />
          <span className="text-sm text-gray-300">
            About {onboardingService.calculateTimeRemaining(progress)} minutes remaining
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;