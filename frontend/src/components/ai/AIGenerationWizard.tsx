import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Settings, 
  FileText,
  Users,
  Target,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  Wand2
} from 'lucide-react';
import { useAI, AIGenerationRequest, AIGenerationResponse } from '../../hooks/useAI';
import { toast } from 'react-hot-toast';

interface AIGenerationWizardProps {
  onComplete: (response: AIGenerationResponse) => void;
  onCancel: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const steps: WizardStep[] = [
  {
    id: 'type',
    title: 'Project Type',
    description: 'What type of product or feature are you building?',
    icon: FileText,
  },
  {
    id: 'context',
    title: 'Context & Details',
    description: 'Provide background information about your project',
    icon: Settings,
  },
  {
    id: 'requirements',
    title: 'Requirements',
    description: 'Specify your functional and business requirements',
    icon: CheckCircle,
  },
  {
    id: 'configuration',
    title: 'AI Configuration',
    description: 'Customize the AI generation settings',
    icon: Wand2,
  },
  {
    id: 'generation',
    title: 'Generate PRD',
    description: 'AI is creating your Product Requirements Document',
    icon: Sparkles,
  },
];

const AIGenerationWizard: React.FC<AIGenerationWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<AIGenerationRequest>>({
    prdType: 'feature',
    style: 'detailed',
    context: {},
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { 
    generatePRD, 
    isGenerating, 
    templates, 
    isLoadingTemplates,
    validateKeys,
    keyValidation 
  } = useAI();

  useEffect(() => {
    validateKeys();
  }, [validateKeys]);

  const updateFormData = (updates: Partial<AIGenerationRequest>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
      context: { ...prev.context, ...updates.context },
    }));
    
    // Clear validation errors for updated fields
    const updatedFields = Object.keys(updates);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => delete newErrors[field]);
      return newErrors;
    });
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    switch (steps[currentStep].id) {
      case 'type':
        if (!formData.prompt || formData.prompt.trim().length < 10) {
          errors.prompt = 'Please provide a detailed description (at least 10 characters)';
        }
        if (!formData.prdType) {
          errors.prdType = 'Please select a project type';
        }
        break;
        
      case 'context':
        // Context is optional, no validation needed
        break;
        
      case 'requirements':
        // Requirements are optional, no validation needed
        break;
        
      case 'configuration':
        if (!formData.style) {
          errors.style = 'Please select a writing style';
        }
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleGenerate();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    if (!formData.prompt || !formData.prdType) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const response = await generatePRD(formData as AIGenerationRequest);
      onComplete(response);
      toast.success('PRD generated successfully!');
    } catch (error) {
      toast.error('Failed to generate PRD');
    }
  };

  const renderStepContent = () => {
    const stepId = steps[currentStep].id;
    
    switch (stepId) {
      case 'type':
        return <ProjectTypeStep formData={formData} updateFormData={updateFormData} templates={templates} errors={validationErrors} />;
      case 'context':
        return <ContextStep formData={formData} updateFormData={updateFormData} />;
      case 'requirements':
        return <RequirementsStep formData={formData} updateFormData={updateFormData} />;
      case 'configuration':
        return <ConfigurationStep formData={formData} updateFormData={updateFormData} templates={templates} errors={validationErrors} />;
      case 'generation':
        return <GenerationStep isGenerating={isGenerating} />;
      default:
        return null;
    }
  };

  if (isLoadingTemplates) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-lg p-8 flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          <span className="text-white">Loading AI templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">AI PRD Generator</h2>
              <p className="text-sm text-white/70">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
              </p>
            </div>
          </div>
          
          <button
            onClick={onCancel}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive 
                        ? 'bg-purple-500 border-purple-500 text-white'
                        : 'border-white/30 text-white/50'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 transition-colors ${
                      isCompleted ? 'bg-green-500' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="text-center">
            <h3 className="font-medium text-white">{steps[currentStep].title}</h3>
            <p className="text-sm text-white/70">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* API Key Validation */}
        {keyValidation && (!keyValidation.anthropic && !keyValidation.openai) && (
          <div className="p-4 border-b border-white/10">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-yellow-300 mb-1">API Configuration Required</h3>
                  <p className="text-sm text-yellow-200/80">
                    No valid AI API keys found. Please configure your Anthropic or OpenAI API keys in the settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="text-sm text-white/70">
            {currentStep + 1} of {steps.length}
          </div>

          <button
            onClick={handleNext}
            disabled={isGenerating || (keyValidation && !keyValidation.anthropic && !keyValidation.openai)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === steps.length - 1 ? (
              <>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>{isGenerating ? 'Generating...' : 'Generate PRD'}</span>
              </>
            ) : (
              <>
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Individual Step Components
interface StepProps {
  formData: Partial<AIGenerationRequest>;
  updateFormData: (updates: Partial<AIGenerationRequest>) => void;
  templates?: any;
  errors?: Record<string, string>;
}

const ProjectTypeStep: React.FC<StepProps> = ({ formData, updateFormData, templates, errors }) => (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-white mb-3">
        Project Description *
      </label>
      <textarea
        value={formData.prompt || ''}
        onChange={(e) => updateFormData({ prompt: e.target.value })}
        rows={4}
        className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
          errors?.prompt ? 'border-red-500' : 'border-white/10'
        }`}
        placeholder="Describe what you want to build in detail. For example: 'A mobile app feature that allows users to share photos with friends and add custom filters...'"
      />
      {errors?.prompt && (
        <p className="mt-1 text-sm text-red-400">{errors.prompt}</p>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-white mb-3">
        Project Type *
      </label>
      <div className="grid grid-cols-2 gap-3">
        {templates?.prdTypes?.map((type: any) => (
          <button
            key={type.value}
            onClick={() => updateFormData({ prdType: type.value })}
            className={`p-4 rounded-lg border text-left transition-colors ${
              formData.prdType === type.value
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            <h3 className="font-medium mb-1">{type.label}</h3>
            <p className="text-sm opacity-70">{type.description}</p>
          </button>
        ))}
      </div>
      {errors?.prdType && (
        <p className="mt-1 text-sm text-red-400">{errors.prdType}</p>
      )}
    </div>
  </div>
);

const ContextStep: React.FC<StepProps> = ({ formData, updateFormData }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Company/Organization
        </label>
        <input
          type="text"
          value={formData.context?.company || ''}
          onChange={(e) => updateFormData({ context: { company: e.target.value } })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Your company name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Industry
        </label>
        <input
          type="text"
          value={formData.context?.industry || ''}
          onChange={(e) => updateFormData({ context: { industry: e.target.value } })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., FinTech, E-commerce, Healthcare"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-white mb-2">
        Target Audience
      </label>
      <textarea
        value={formData.context?.targetAudience || ''}
        onChange={(e) => updateFormData({ context: { targetAudience: e.target.value } })}
        rows={3}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        placeholder="Describe your target users, their demographics, needs, and behaviors..."
      />
    </div>

    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Timeline
        </label>
        <input
          type="text"
          value={formData.context?.timeline || ''}
          onChange={(e) => updateFormData({ context: { timeline: e.target.value } })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., 3 months, Q2 2024"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Budget Range
        </label>
        <input
          type="text"
          value={formData.context?.budget || ''}
          onChange={(e) => updateFormData({ context: { budget: e.target.value } })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., $50K-100K, Limited budget"
        />
      </div>
    </div>
  </div>
);

const RequirementsStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const [newRequirement, setNewRequirement] = useState('');
  const [newStakeholder, setNewStakeholder] = useState('');

  const addRequirement = () => {
    if (newRequirement.trim()) {
      const requirements = formData.context?.requirements || [];
      updateFormData({ 
        context: { 
          requirements: [...requirements, newRequirement.trim()]
        }
      });
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    const requirements = formData.context?.requirements || [];
    updateFormData({ 
      context: { 
        requirements: requirements.filter((_, i) => i !== index)
      }
    });
  };

  const addStakeholder = () => {
    if (newStakeholder.trim()) {
      const stakeholders = formData.context?.stakeholders || [];
      updateFormData({ 
        context: { 
          stakeholders: [...stakeholders, newStakeholder.trim()]
        }
      });
      setNewStakeholder('');
    }
  };

  const removeStakeholder = (index: number) => {
    const stakeholders = formData.context?.stakeholders || [];
    updateFormData({ 
      context: { 
        stakeholders: stakeholders.filter((_, i) => i !== index)
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Key Requirements
        </label>
        <div className="space-y-2">
          {(formData.context?.requirements || []).map((req, index) => (
            <div key={index} className="flex items-center space-x-2 bg-white/5 rounded-lg p-3">
              <span className="flex-1 text-white text-sm">{req}</span>
              <button
                onClick={() => removeRequirement(index)}
                className="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Add a key requirement..."
            />
            <button
              onClick={addRequirement}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Key Stakeholders
        </label>
        <div className="space-y-2">
          {(formData.context?.stakeholders || []).map((stakeholder, index) => (
            <div key={index} className="flex items-center space-x-2 bg-white/5 rounded-lg p-3">
              <span className="flex-1 text-white text-sm">{stakeholder}</span>
              <button
                onClick={() => removeStakeholder(index)}
                className="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newStakeholder}
              onChange={(e) => setNewStakeholder(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addStakeholder()}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Add a stakeholder..."
            />
            <button
              onClick={addStakeholder}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfigurationStep: React.FC<StepProps> = ({ formData, updateFormData, templates, errors }) => (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-white mb-3">
        Writing Style *
      </label>
      <div className="grid grid-cols-1 gap-3">
        {templates?.styles?.map((style: any) => (
          <button
            key={style.value}
            onClick={() => updateFormData({ style: style.value })}
            className={`p-4 rounded-lg border text-left transition-colors ${
              formData.style === style.value
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            <h3 className="font-medium mb-1">{style.label}</h3>
            <p className="text-sm opacity-70">{style.description}</p>
          </button>
        ))}
      </div>
      {errors?.style && (
        <p className="mt-1 text-sm text-red-400">{errors.style}</p>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-white mb-2">
        Custom Instructions (Optional)
      </label>
      <textarea
        value={formData.customInstructions || ''}
        onChange={(e) => updateFormData({ customInstructions: e.target.value })}
        rows={3}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        placeholder="Any specific instructions or preferences for the AI..."
      />
    </div>
  </div>
);

const GenerationStep: React.FC<{ isGenerating: boolean }> = ({ isGenerating }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-6">
      {isGenerating ? (
        <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
      ) : (
        <Sparkles className="h-8 w-8 text-purple-400" />
      )}
    </div>
    
    <h3 className="text-xl font-semibold text-white mb-2">
      {isGenerating ? 'Generating Your PRD...' : 'Ready to Generate'}
    </h3>
    
    <p className="text-white/70 mb-6">
      {isGenerating 
        ? 'Our AI is analyzing your requirements and creating a comprehensive PRD. This may take a few moments.'
        : 'Click "Generate PRD" to create your Product Requirements Document using AI.'
      }
    </p>
    
    {isGenerating && (
      <div className="max-w-md mx-auto">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
          <p className="text-sm text-white/50 mt-2">This usually takes 30-60 seconds</p>
        </div>
      </div>
    )}
  </div>
);

export default AIGenerationWizard;