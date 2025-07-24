import React from 'react';
import { TemplateUsageStats } from 'prd-creator-shared';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TemplateUsageChartProps {
  data: TemplateUsageStats[];
}

const TemplateUsageChart: React.FC<TemplateUsageChartProps> = ({ data }) => {
  const maxUsage = Math.max(...data.map(template => template.usageCount));

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      feature: 'bg-purple-500',
      product: 'bg-blue-500',
      api: 'bg-green-500',
      mobile: 'bg-yellow-500',
      web: 'bg-pink-500',
      enhancement: 'bg-indigo-500',
      custom: 'bg-orange-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-400" />;
    return null;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-400';
    if (growth < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <p>No template usage data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="space-y-3">
        {data.map((template) => {
          const percentage = maxUsage > 0 ? (template.usageCount / maxUsage) * 100 : 0;
          
          return (
            <div key={template.templateName} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-white truncate max-w-32">
                    {template.templateName}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full text-white ${getTypeColor(template.templateType)}`}>
                    {template.templateType}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300">
                    {template.usageCount}
                  </span>
                  {template.usageGrowth !== 0 && (
                    <div className="flex items-center space-x-1">
                      {getGrowthIcon(template.usageGrowth)}
                      <span className={`text-xs ${getGrowthColor(template.usageGrowth)}`}>
                        {Math.abs(template.usageGrowth).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2 group-hover:h-3 transition-all duration-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getTypeColor(template.templateType)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                <span>#{template.popularityRank}</span>
                <span>{percentage.toFixed(1)}% of max usage</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-white">
              {data.reduce((sum, template) => sum + template.usageCount, 0)}
            </div>
            <div className="text-xs text-gray-400">Total Usage</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">
              {data.length}
            </div>
            <div className="text-xs text-gray-400">Active Templates</div>
          </div>
        </div>
      </div>
      
      {/* Top Template */}
      {data.length > 0 && (
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <div className="text-sm text-gray-300 mb-1">Most Popular</div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-white">{data[0].templateName}</span>
            <span className="text-purple-400">{data[0].usageCount} uses</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateUsageChart;