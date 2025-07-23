import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  Clock,
  SkipForward,
  BookOpen
} from 'lucide-react';
import { TutorialStep } from 'prd-creator-shared';
import { useOnboarding } from '../../hooks/useOnboarding';

interface TutorialPlayerProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
}

const TutorialPlayer: React.FC<TutorialPlayerProps> = ({ 
  steps, 
  onComplete, 
  onSkip 
}) => {
  const { startStep, completeStep } = useOnboarding(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  useEffect(() => {
    if (currentStep && !startTime) {
      setStartTime(new Date());
      startStep(currentStep.id);
    }
  }, [currentStep, startTime, startStep]);

  const handleNext = async () => {
    if (currentStep && startTime) {
      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      
      try {
        await completeStep(currentStep.id, timeSpent);
        setCompletedSteps(prev => new Set([...prev, currentStep.id]));
      } catch (error) {
        console.error('Failed to complete step:', error);
      }
    }

    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
      setStartTime(new Date());
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
      setStartTime(new Date());
    }
  };

  const handleSkipStep = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
      setStartTime(new Date());
    }
  };

  const getTotalEstimatedTime = () => {
    return steps.reduce((total, step) => total + step.estimated_time_minutes, 0);
  };

  const getCompletedTime = () => {
    return steps
      .slice(0, currentStepIndex)
      .reduce((total, step) => total + step.estimated_time_minutes, 0);
  };

  const getProgressPercentage = () => {
    return Math.round((getCompletedTime() / getTotalEstimatedTime()) * 100);
  };

  if (!currentStep) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">📚</div>
        <h2 className="text-2xl font-bold text-white mb-4">
          No tutorials available
        </h2>
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">🎓</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Interactive Tutorial
        </h2>
        <p className="text-gray-300">
          Learn the essentials of PRD Creator in just a few minutes
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-300">
            {getProgressPercentage()}% complete
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full transition-colors ${
                index < currentStepIndex
                  ? 'bg-green-500'
                  : index === currentStepIndex
                  ? 'bg-purple-500'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
        {/* Step Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <BookOpen className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {currentStep.title}
              </h3>
              <p className="text-gray-300 text-sm">
                {currentStep.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{currentStep.estimated_time_minutes} min</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-6">
          {currentStep.content.steps?.map((contentStep, index) => (
            <div key={contentStep.id} className="mb-6 last:mb-0">
              <h4 className="text-lg font-medium text-white mb-3">
                {contentStep.title}
              </h4>
              
              {contentStep.description && (
                <p className="text-gray-300 mb-4">
                  {contentStep.description}
                </p>
              )}
              
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 leading-relaxed">
                  {contentStep.content}
                </div>
              </div>

              {/* Media Content */}
              {contentStep.media && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-center h-32 text-gray-400">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎬</div>
                      <p className="text-sm">Media content would appear here</p>
                      <p className="text-xs">({contentStep.media.type})</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Item */}
              {contentStep.action && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-blue-400 font-medium text-sm">Try it out:</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {contentStep.action.type === 'click' && 'Click on: '}
                    {contentStep.action.type === 'navigate' && 'Navigate to: '}
                    {contentStep.action.type === 'input' && 'Enter: '}
                    {contentStep.action.target || 'Interactive element'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Resources */}
        {currentStep.content.resources && currentStep.content.resources.length > 0 && (
          <div className="border-t border-white/10 pt-6">
            <h4 className="text-sm font-medium text-gray-300 mb-3">
              Additional Resources:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentStep.content.resources.map((resource, index) => (
                <div 
                  key={index}
                  className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs">
                      {resource.type === 'link' ? '🔗' : 
                       resource.type === 'download' ? '📥' : '📄'}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {resource.title}
                    </span>
                  </div>
                  {resource.description && (
                    <p className="text-xs text-gray-400">
                      {resource.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={isFirstStep}
          className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleSkipStep}
            className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward className="h-4 w-4" />
            <span>Skip</span>
          </button>

          <button
            onClick={onSkip}
            className="px-4 py-2 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            Skip All
          </button>

          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <span>{isLastStep ? 'Complete' : 'Continue'}</span>
            {!isLastStep && <ChevronRight className="h-4 w-4" />}
            {isLastStep && <CheckCircle className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Tutorial Progress Summary */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-4 px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm text-gray-300">
              {completedSteps.size} completed
            </span>
          </div>
          <div className="w-px h-4 bg-white/20"></div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-gray-300">
              ~{getTotalEstimatedTime() - getCompletedTime()} min remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialPlayer;