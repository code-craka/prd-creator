import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useOnboarding } from '../../hooks/useOnboarding';
import ProfileSetup from './ProfileSetup';
import TemplateSelection from './TemplateSelection';
import TutorialPlayer from './TutorialPlayer';
import ProgressIndicator from './ProgressIndicator';
import { OnboardingWizardProps, OnboardingStep } from 'prd-creator-shared';

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ 
  onComplete, 
  onSkip 
}) => {
  const {
    progress,
    isLoading,
    error,
    recommendations,
    initializeOnboarding,
    updateProfile,
    completeStep,
    skipOnboarding,
    loadRecommendations,
    getTimeRemaining,
    clearError
  } = useOnboarding();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showConfirmSkip, setShowConfirmSkip] = useState(false);

  const steps: OnboardingStep[] = [
    'welcome',
    'profile-setup', 
    'template-selection',
    'tutorial',
    'completed'
  ];

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (!progress) {
      initializeOnboarding();
    }
  }, [progress, initializeOnboarding]);

  useEffect(() => {
    if (progress && !isLoading) {
      // Determine which step to show based on progress
      const { onboarding } = progress;
      
      if (!onboarding.welcome_completed) {
        setCurrentStepIndex(0);
      } else if (!onboarding.profile_setup_completed) {
        setCurrentStepIndex(1);
      } else if (!onboarding.first_prd_created) {
        setCurrentStepIndex(2);
      } else if (!onboarding.tutorial_completed) {
        setCurrentStepIndex(3);
      } else {
        setCurrentStepIndex(4);
        onComplete();
      }
    }
  }, [progress, isLoading, onComplete]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = async () => {
    if (onSkip) {
      await skipOnboarding();
      onSkip();
    }
    setShowConfirmSkip(false);
  };

  const handleWelcomeComplete = async () => {
    try {
      await completeStep('welcome');
      handleNext();
    } catch (error) {
      console.error('Failed to complete welcome step:', error);
    }
  };

  const handleProfileComplete = async (profileData: any) => {
    try {
      await updateProfile(profileData);
      await loadRecommendations();
      handleNext();
    } catch (error) {
      console.error('Failed to complete profile setup:', error);
    }
  };

  const handleTemplateSelected = () => {
    handleNext();
  };

  const handleTutorialComplete = () => {
    setCurrentStepIndex(4);
    onComplete();
  };

  if (isLoading && !progress) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
          <p className="text-center text-gray-600">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Setup Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex space-x-3">
              <button
                onClick={clearError}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Skip Setup
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <h1 className="text-xl font-bold text-white">PRD Creator Setup</h1>
            </div>
            {progress && (
              <div className="text-sm text-gray-300">
                {getTimeRemaining()} minutes remaining
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {onSkip && (
              <button
                onClick={() => setShowConfirmSkip(true)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Skip Setup
              </button>
            )}
            <button
              onClick={onSkip || onComplete}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="px-6 py-4">
            <ProgressIndicator progress={progress} />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-4xl w-full">
            {currentStep === 'welcome' && (
              <WelcomeStep onComplete={handleWelcomeComplete} />
            )}
            
            {currentStep === 'profile-setup' && (
              <ProfileSetup 
                onComplete={handleProfileComplete}
                initialData={progress?.onboarding}
              />
            )}
            
            {currentStep === 'template-selection' && (
              <TemplateSelection
                recommendations={recommendations}
                onSelect={handleTemplateSelected}
                onSkip={handleNext}
              />
            )}
            
            {currentStep === 'tutorial' && progress && (
              <TutorialPlayer
                steps={progress.tutorialSteps.filter(s => s.is_required)}
                onComplete={handleTutorialComplete}
                onSkip={handleTutorialComplete}
              />
            )}
            
            {currentStep === 'completed' && (
              <CompletedStep onFinish={onComplete} />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <button
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            
            <div className="flex items-center space-x-2">
              {steps.slice(0, -1).map((step, index) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStepIndex
                      ? 'bg-purple-400'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={handleNext}
              disabled={currentStepIndex === steps.length - 1}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Skip Confirmation Modal */}
      {showConfirmSkip && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-60 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Skip Setup?
            </h3>
            <p className="text-gray-600 mb-6">
              You can always complete the setup later from your dashboard. 
              Are you sure you want to skip?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmSkip(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Skip Setup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Welcome Step Component
const WelcomeStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="text-6xl mb-4">👋</div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Welcome to PRD Creator!
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Let's get you set up to create amazing Product Requirements Documents. 
          This will only take a few minutes.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="text-3xl mb-3">🤖</div>
          <h3 className="text-lg font-semibold text-white mb-2">AI-Powered</h3>
          <p className="text-gray-300 text-sm">
            Generate comprehensive PRDs with AI assistance
          </p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="text-lg font-semibold text-white mb-2">Team Collaboration</h3>
          <p className="text-gray-300 text-sm">
            Work together in real-time with your team
          </p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
          <p className="text-gray-300 text-sm">
            Track team productivity and insights
          </p>
        </div>
      </div>
      
      <button
        onClick={onComplete}
        className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
      >
        <span>Get Started</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};

// Completed Step Component
const CompletedStep: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-white mb-4">
          You're All Set!
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Your PRD Creator workspace is ready. Start creating amazing 
          Product Requirements Documents with your team.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Profile Setup</h3>
          <p className="text-gray-300 text-sm">
            Your profile is configured for personalized recommendations
          </p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Templates Ready</h3>
          <p className="text-gray-300 text-sm">
            Industry-specific templates are available for quick starts
          </p>
        </div>
      </div>
      
      <button
        onClick={onFinish}
        className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Enter Dashboard
      </button>
    </div>
  );
};

export default OnboardingWizard;