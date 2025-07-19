import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  color: 'purple' | 'blue' | 'green' | 'orange' | 'red';
  trend?: 'up' | 'down' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color,
  trend
}) => {
  const colorClasses = {
    purple: 'text-purple-400 bg-purple-500/20',
    blue: 'text-blue-400 bg-blue-500/20',
    green: 'text-green-400 bg-green-500/20',
    orange: 'text-orange-400 bg-orange-500/20',
    red: 'text-red-400 bg-red-500/20',
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-400" />;
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {getTrendIcon()}
      </div>
      
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        <div className="text-2xl font-bold text-white mt-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>
      
      {(change !== undefined || changeLabel) && (
        <div className="flex items-center text-sm">
          {change !== undefined && (
            <span className={`font-medium ${getTrendColor()}`}>
              {change > 0 ? '+' : ''}{change}
            </span>
          )}
          {changeLabel && (
            <span className="text-gray-400 ml-1">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard;