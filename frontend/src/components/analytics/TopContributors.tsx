import React from 'react';
import { Crown, Award, Medal, Star } from 'lucide-react';

interface Contributor {
  userId: string;
  userName: string;
  prdsCreated: number;
  commentsCount: number;
}

interface TopContributorsProps {
  contributors: Contributor[];
}

const TopContributors: React.FC<TopContributorsProps> = ({ contributors }) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2: return <Award className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-orange-400" />;
      default: return <Star className="h-5 w-5 text-purple-400" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500/20 border-yellow-500/30';
      case 2: return 'bg-gray-500/20 border-gray-500/30';
      case 3: return 'bg-orange-500/20 border-orange-500/30';
      default: return 'bg-purple-500/20 border-purple-500/30';
    }
  };

  const getTotalContributions = (contributor: Contributor) => {
    return contributor.prdsCreated + contributor.commentsCount;
  };

  if (contributors.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">🏆</div>
          <p>No contributor data available</p>
        </div>
      </div>
    );
  }

  const maxContributions = Math.max(...contributors.map(getTotalContributions));

  return (
    <div className="space-y-4">
      {/* Top Contributors List */}
      <div className="space-y-3">
        {contributors.map((contributor, index) => {
          const rank = index + 1;
          const totalContributions = getTotalContributions(contributor);
          const contributionPercentage = maxContributions > 0 
            ? (totalContributions / maxContributions) * 100 
            : 0;

          return (
            <div
              key={contributor.userId}
              className={`p-4 rounded-lg border ${getRankColor(rank)} transition-all duration-200 hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getRankIcon(rank)}
                  <div>
                    <div className="font-medium text-white">{contributor.userName}</div>
                    <div className="text-xs text-gray-400">#{rank} Contributor</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{totalContributions}</div>
                  <div className="text-xs text-gray-400">total</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${contributionPercentage}%` }}
                />
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between bg-white/5 rounded px-2 py-1">
                  <span className="text-gray-300">PRDs</span>
                  <span className="text-purple-400 font-medium">{contributor.prdsCreated}</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded px-2 py-1">
                  <span className="text-gray-300">Comments</span>
                  <span className="text-blue-400 font-medium">{contributor.commentsCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="pt-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-purple-400">
              {contributors.reduce((sum, c) => sum + c.prdsCreated, 0)}
            </div>
            <div className="text-xs text-gray-400">Total PRDs</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-400">
              {contributors.reduce((sum, c) => sum + c.commentsCount, 0)}
            </div>
            <div className="text-xs text-gray-400">Total Comments</div>
          </div>
        </div>
      </div>

      {/* Achievement Badge for Top Contributor */}
      {contributors.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Top Performer</span>
          </div>
          <div className="text-white font-medium">{contributors[0].userName}</div>
          <div className="text-xs text-gray-300">
            {contributors[0].prdsCreated} PRDs created this period
          </div>
        </div>
      )}
    </div>
  );
};

export default TopContributors;