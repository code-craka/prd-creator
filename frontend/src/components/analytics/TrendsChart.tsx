import React from 'react';
import { PRDTrends, TimeRange } from '../../types/analytics';

interface TrendsChartProps {
  data: PRDTrends;
  timeRange: TimeRange;
}

const TrendsChart: React.FC<TrendsChartProps> = ({ data, timeRange }) => {
  const getChartData = () => {
    switch (timeRange) {
      case '7d':
        return data.daily.slice(-7);
      case '30d':
        return data.daily.slice(-30);
      case '90d':
        return data.weekly.slice(-13); // Last 13 weeks
      default:
        return data.daily.slice(-30);
    }
  };

  const chartData = getChartData();
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.prdsCreated, d.prdsEdited, d.activeUsers))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (timeRange === '90d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };

  const getBarHeight = (value: number) => {
    return maxValue > 0 ? (value / maxValue) * 200 : 0;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No data available for the selected period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <div className="flex items-end justify-between h-48 mb-4 space-x-1">
        {chartData.map((item, index) => {
          const date = 'date' in item ? item.date : item.week;
          const createdHeight = getBarHeight(item.prdsCreated);
          const editedHeight = getBarHeight(item.prdsEdited);
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="flex items-end space-x-1 mb-2 h-48">
                {/* PRDs Created */}
                <div
                  className="bg-purple-500 rounded-t-sm min-w-[4px] hover:bg-purple-400 transition-colors"
                  style={{ height: `${createdHeight}px` }}
                  title={`PRDs Created: ${item.prdsCreated}`}
                />
                
                {/* PRDs Edited */}
                <div
                  className="bg-blue-500 rounded-t-sm min-w-[4px] hover:bg-blue-400 transition-colors"
                  style={{ height: `${editedHeight}px` }}
                  title={`PRDs Edited: ${item.prdsEdited}`}
                />
              </div>
              
              {/* Date Label */}
              <div className="text-xs text-gray-400 transform -rotate-45 origin-top-left">
                {formatDate(date)}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
          <span className="text-gray-300">PRDs Created</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span className="text-gray-300">PRDs Edited</span>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-purple-400">
            {chartData.reduce((sum, item) => sum + item.prdsCreated, 0)}
          </div>
          <div className="text-xs text-gray-400">Total Created</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-blue-400">
            {chartData.reduce((sum, item) => sum + item.prdsEdited, 0)}
          </div>
          <div className="text-xs text-gray-400">Total Edited</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-green-400">
            {Math.max(...chartData.map(item => item.activeUsers))}
          </div>
          <div className="text-xs text-gray-400">Peak Users</div>
        </div>
      </div>
    </div>
  );
};

export default TrendsChart;