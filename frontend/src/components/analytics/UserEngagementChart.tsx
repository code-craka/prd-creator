import React from 'react';
import { UserEngagementInsights } from '../../types/analytics';
import { Users, UserPlus, Clock, Target } from 'lucide-react';

interface UserEngagementChartProps {
  data: UserEngagementInsights;
}

const UserEngagementChart: React.FC<UserEngagementChartProps> = ({ data }) => {
  const activityRate = data.totalUsers > 0 ? (data.activeUsers / data.totalUsers) * 100 : 0;

  const getRetentionColor = (rate: number) => {
    if (rate >= 70) return 'text-green-400 bg-green-500/20';
    if (rate >= 50) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg mx-auto mb-2">
            <Users className="h-6 w-6 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{data.totalUsers}</div>
          <div className="text-xs text-gray-400">Total Users</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mx-auto mb-2">
            <Target className="h-6 w-6 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">{data.activeUsers}</div>
          <div className="text-xs text-gray-400">Active Users</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mx-auto mb-2">
            <UserPlus className="h-6 w-6 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{data.newUsers}</div>
          <div className="text-xs text-gray-400">New Users</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-lg mx-auto mb-2">
            <Clock className="h-6 w-6 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatTime(data.averageSessionTime)}
          </div>
          <div className="text-xs text-gray-400">Avg Session</div>
        </div>
      </div>

      {/* Activity Rate Visualization */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">User Activity Rate</h3>
          <span className="text-sm text-white">{activityRate.toFixed(1)}%</span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${activityRate}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{data.activeUsers} active</span>
          <span>{data.totalUsers - data.activeUsers} inactive</span>
        </div>
      </div>

      {/* Retention Rates */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Retention Rates</h3>
        
        <div className="grid grid-cols-3 gap-3">
          <div className={`rounded-lg p-3 ${getRetentionColor(data.userRetention.daily)}`}>
            <div className="text-lg font-bold">{data.userRetention.daily.toFixed(1)}%</div>
            <div className="text-xs opacity-75">Daily</div>
          </div>
          
          <div className={`rounded-lg p-3 ${getRetentionColor(data.userRetention.weekly)}`}>
            <div className="text-lg font-bold">{data.userRetention.weekly.toFixed(1)}%</div>
            <div className="text-xs opacity-75">Weekly</div>
          </div>
          
          <div className={`rounded-lg p-3 ${getRetentionColor(data.userRetention.monthly)}`}>
            <div className="text-lg font-bold">{data.userRetention.monthly.toFixed(1)}%</div>
            <div className="text-xs opacity-75">Monthly</div>
          </div>
        </div>
      </div>

      {/* Top Active Users */}
      {data.topUsers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Most Active Users</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.topUsers.slice(0, 5).map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 rounded-full text-purple-400 text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{user.userName}</div>
                    <div className="text-xs text-gray-400">
                      {user.prdsCreated} PRDs • {formatLastActive(user.lastActive)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-purple-400 font-medium">
                    {formatTime(user.timeSpent)}
                  </div>
                  <div className="text-xs text-gray-400">time spent</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserEngagementChart;