import React, { useState } from 'react';
import { 
  Star, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Filter,
  Search
} from 'lucide-react';
import { onboardingService } from '../../services/onboardingService';
import { TemplateSelectionProps, PRDTemplate } from 'prd-creator-shared';

const TemplateSelection: React.FC<TemplateSelectionProps> = ({ 
  recommendations, 
  onSelect, 
  onSkip 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PRDTemplate | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'feature', label: 'Features' },
    { value: 'product', label: 'Products' },
    { value: 'api', label: 'APIs' },
    { value: 'mobile', label: 'Mobile Apps' },
    { value: 'web', label: 'Web Apps' }
  ];

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesCategory = filterCategory === 'all' || rec.template.category === filterCategory;
    const matchesSearch = searchTerm === '' || 
      rec.template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const handleTemplateSelect = (template: PRDTemplate) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-400'
        }`}
      />
    ));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Your Starting Template
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          We've found templates that match your profile. Pick one to get started 
          quickly, or skip to create from scratch.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="pl-10 pr-8 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value} className="bg-gray-800">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredRecommendations.map((recommendation) => {
          const { template } = recommendation;
          const isSelected = selectedTemplate?.id === template.id;
          
          return (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`bg-white/5 backdrop-blur-sm border rounded-xl p-6 cursor-pointer transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-white/10 hover:border-white/30 hover:bg-white/10'
              }`}
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {onboardingService.getCategoryIcon(template.category)}
                  </span>
                  {template.is_featured && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                      <Sparkles className="h-3 w-3" />
                      <span>Featured</span>
                    </div>
                  )}
                </div>
                
                {isSelected && (
                  <CheckCircle className="h-6 w-6 text-purple-400" />
                )}
              </div>

              {/* Template Info */}
              <h3 className="text-lg font-semibold text-white mb-2">
                {template.name}
              </h3>
              <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                {template.description}
              </p>

              {/* Match Score Badge */}
              <div className="mb-4">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  onboardingService.getRecommendationBadgeColor(recommendation)
                }`}>
                  {onboardingService.getRecommendationBadge(recommendation)}
                </span>
              </div>

              {/* Recommendation Reasons */}
              {recommendation.recommendationReasons.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-400 mb-1">Why this matches:</div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {recommendation.recommendationReasons.slice(0, 2).map((reason, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1 h-1 bg-purple-400 rounded-full mr-2"></div>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Template Stats */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="flex">{renderStars(template.rating)}</div>
                    <span>({template.rating_count})</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{onboardingService.formatEstimatedTime(recommendation.estimatedTimeToComplete)}</span>
                  </div>
                </div>
                
                <div className={`text-xs ${onboardingService.getDifficultyColor(template.complexity_level)}`}>
                  {template.complexity_level}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredRecommendations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No templates found
          </h3>
          <p className="text-gray-300 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('all');
            }}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Selected Template Details */}
      {selectedTemplate && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Template Preview: {selectedTemplate.name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-2">Sections Include:</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                {selectedTemplate.template_content.sections.slice(0, 5).map((section, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1 h-1 bg-purple-400 rounded-full mr-2"></div>
                    {section.title}
                  </li>
                ))}
                {selectedTemplate.template_content.sections.length > 5 && (
                  <li className="text-gray-400 italic">
                    + {selectedTemplate.template_content.sections.length - 5} more sections
                  </li>
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">Template Info:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Industry:</span>
                  <span className="capitalize">{selectedTemplate.industry}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Category:</span>
                  <span className="capitalize">{selectedTemplate.category}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Complexity:</span>
                  <span className="capitalize">{selectedTemplate.complexity_level}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Used by:</span>
                  <span>{selectedTemplate.usage_count} teams</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onSkip}
          className="px-6 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          Start from Scratch
        </button>
        
        <button
          onClick={handleUseTemplate}
          disabled={!selectedTemplate}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <span>Use This Template</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default TemplateSelection;