import React, { useState, useEffect } from 'react';
import { ChevronDown, Building, Users, TrendingUp, User } from 'lucide-react';
import { useOnboarding } from '../../hooks/useOnboarding';
import { onboardingService } from '../../services/onboardingService';
import { 
  ProfileSetupProps, 
  ProfileData, 
  CompanyType, 
  TeamSize, 
  ExperienceLevel 
} from 'prd-creator-shared';

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, initialData }) => {
  const { industries, companyTypes, isLoading } = useOnboarding(false);
  
  const [formData, setFormData] = useState<ProfileData>({
    companyType: initialData?.company_type || '',
    industry: initialData?.industry || '',
    teamSize: initialData?.team_size || '',
    experienceLevel: initialData?.experience_level || '',
    preferences: initialData?.preferences || {}
  });

  const [errors, setErrors] = useState<Partial<ProfileData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const teamSizeOptions = [
    { value: 'solo', label: 'Just me', description: 'Working independently' },
    { value: 'small', label: '2-10 people', description: 'Small team or startup' },
    { value: 'medium', label: '11-50 people', description: 'Growing team' },
    { value: 'large', label: '50+ people', description: 'Large organization' }
  ];

  const experienceLevels = [
    { 
      value: 'beginner', 
      label: 'Beginner', 
      description: 'New to product management',
      icon: '🌱'
    },
    { 
      value: 'intermediate', 
      label: 'Intermediate', 
      description: 'Some PM experience',
      icon: '🌿'
    },
    { 
      value: 'expert', 
      label: 'Expert', 
      description: 'Experienced product manager',
      icon: '🌳'
    }
  ];

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileData> = {};

    if (!formData.companyType) {
      newErrors.companyType = 'Please select your company type';
    }

    if (!formData.industry) {
      newErrors.industry = 'Please select your industry';
    }

    if (!formData.teamSize) {
      newErrors.teamSize = 'Please select your team size';
    }

    if (!formData.experienceLevel) {
      newErrors.experienceLevel = 'Please select your experience level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete(formData);
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Error is handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedCompanyType = () => {
    return companyTypes.find(ct => ct.type_key === formData.companyType);
  };

  const getSelectedIndustry = () => {
    return industries.find(i => i.industry_key === formData.industry);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">🏢</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Tell us about yourself
        </h2>
        <p className="text-gray-300">
          This helps us personalize your PRD Creator experience with relevant 
          templates and features.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <Building className="inline h-4 w-4 mr-2" />
            Company Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {companyTypes.map((type) => (
              <button
                key={type.type_key}
                type="button"
                onClick={() => handleInputChange('companyType', type.type_key)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  formData.companyType === type.type_key
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{type.type_name}</span>
                  <span className="text-lg">
                    {onboardingService.getCompanyTypeIcon(type.type_key)}
                  </span>
                </div>
                <p className="text-sm opacity-80">{type.description}</p>
              </button>
            ))}
          </div>
          {errors.companyType && (
            <p className="text-red-400 text-sm mt-2">{errors.companyType}</p>
          )}
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <TrendingUp className="inline h-4 w-4 mr-2" />
            Industry
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {industries.map((industry) => (
              <button
                key={industry.industry_key}
                type="button"
                onClick={() => handleInputChange('industry', industry.industry_key)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  formData.industry === industry.industry_key
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{industry.industry_name}</span>
                  <span className="text-lg">
                    {onboardingService.getIndustryIcon(industry.industry_key)}
                  </span>
                </div>
                <p className="text-sm opacity-80">{industry.description}</p>
              </button>
            ))}
          </div>
          {errors.industry && (
            <p className="text-red-400 text-sm mt-2">{errors.industry}</p>
          )}
        </div>

        {/* Team Size */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <Users className="inline h-4 w-4 mr-2" />
            Team Size
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teamSizeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInputChange('teamSize', option.value)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  formData.teamSize === option.value
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/30'
                }`}
              >
                <div className="font-medium mb-1">{option.label}</div>
                <p className="text-sm opacity-80">{option.description}</p>
              </button>
            ))}
          </div>
          {errors.teamSize && (
            <p className="text-red-400 text-sm mt-2">{errors.teamSize}</p>
          )}
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <User className="inline h-4 w-4 mr-2" />
            Experience with Product Management
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {experienceLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => handleInputChange('experienceLevel', level.value)}
                className={`p-4 rounded-lg border text-center transition-all ${
                  formData.experienceLevel === level.value
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/30'
                }`}
              >
                <div className="text-2xl mb-2">{level.icon}</div>
                <div className="font-medium mb-1">{level.label}</div>
                <p className="text-sm opacity-80">{level.description}</p>
              </button>
            ))}
          </div>
          {errors.experienceLevel && (
            <p className="text-red-400 text-sm mt-2">{errors.experienceLevel}</p>
          )}
        </div>

        {/* Preview */}
        {formData.companyType && formData.industry && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Personalization Preview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Recommended Templates:</span>
                <span className="text-purple-400">
                  {getSelectedIndustry()?.typical_prd_types.length || 0} types
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Suggested Features:</span>
                <span className="text-purple-400">
                  {getSelectedCompanyType()?.recommended_features.length || 0} features
                </span>
              </div>
              {formData.experienceLevel && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Complexity Level:</span>
                  <span className="text-purple-400 capitalize">
                    {formData.experienceLevel === 'beginner' ? 'Basic' :
                     formData.experienceLevel === 'intermediate' ? 'Intermediate' : 'Advanced'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSetup;