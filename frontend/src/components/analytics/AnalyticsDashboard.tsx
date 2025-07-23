import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  MessageSquare, 
  Clock,
  Target,
  Award,
  Calendar,
  Activity
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { AnalyticsDashboardData, TimeRange } from 'prd-creator-shared';
import MetricCard from './MetricCard';
import TrendsChart from './TrendsChart';
import TemplateUsageChart from './TemplateUsageChart';
import UserEngagementChart from './UserEngagementChart';
import TopContributors from './TopContributors';

interface AnalyticsDashboardProps {
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await analyticsService.getDashboardData(timeRange);
      setData(dashboardData);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeLabel = (range: TimeRange): string => {
    switch (range) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      default: return 'Last 30 days';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${className}`}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${className}`}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-400 mb-2">⚠️</div>
              <h3 className="text-lg font-semibold text-white mb-2">Unable to load analytics</h3>
              <p className="text-gray-300 mb-4">{error}</p>
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { teamProductivity, prdTrends, templateUsage, userEngagement } = data;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${className}`}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-300">
              Insights for {teamProductivity.teamName}
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total PRDs"
            value={teamProductivity.totalPrds}
            change={teamProductivity.prdsThisMonth}
            changeLabel={`${teamProductivity.prdsThisMonth} this month`}
            icon={FileText}
            color="purple"
          />
          
          <MetricCard
            title="Active Users"
            value={teamProductivity.activeUsers}
            change={userEngagement.newUsers}
            changeLabel={`${userEngagement.newUsers} new users`}
            icon={Users}
            color="blue"
          />
          
          <MetricCard
            title="Comments"
            value={teamProductivity.totalComments}
            change={teamProductivity.prdsThisWeek}
            changeLabel={`${teamProductivity.prdsThisWeek} PRDs this week`}
            icon={MessageSquare}
            color="green"
          />
          
          <MetricCard
            title="Avg. Completion"
            value={`${teamProductivity.avgCompletionTime.toFixed(1)}h`}
            change={teamProductivity.collaborationSessions}
            changeLabel={`${teamProductivity.collaborationSessions} sessions`}
            icon={Clock}
            color="orange"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* PRD Trends Chart */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-purple-400" />
                PRD Creation Trends
              </h2>
            </div>
            <TrendsChart data={prdTrends} timeRange={timeRange} />
          </div>

          {/* Template Usage Chart */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <BarChart3 className="h-6 w-6 mr-2 text-blue-400" />
                Popular Templates
              </h2>
            </div>
            <TemplateUsageChart data={templateUsage.slice(0, 8)} />
          </div>
        </div>

        {/* User Engagement and Top Contributors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Engagement */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Activity className="h-6 w-6 mr-2 text-green-400" />
                User Engagement
              </h2>
            </div>
            <UserEngagementChart data={userEngagement} />
          </div>

          {/* Top Contributors */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Award className="h-6 w-6 mr-2 text-yellow-400" />
                Top Contributors
              </h2>
            </div>
            <TopContributors contributors={teamProductivity.topContributors} />
          </div>
        </div>

        {/* Additional Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Target className="h-6 w-6 mr-2 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Productivity Score</h3>
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {Math.round((teamProductivity.prdsThisMonth / teamProductivity.activeUsers) * 10)}%
            </div>
            <p className="text-gray-300 text-sm">
              Based on PRDs per active user
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 mr-2 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Team Retention</h3>
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {userEngagement.userRetention.weekly.toFixed(1)}%
            </div>
            <p className="text-gray-300 text-sm">
              Weekly user retention rate
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 mr-2 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Avg. Session</h3>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">
              {Math.round(userEngagement.averageSessionTime)}m
            </div>
            <p className="text-gray-300 text-sm">
              Average session duration
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          Last updated: {new Date(data.generatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;