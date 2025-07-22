import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { prdService } from '../services/prdService';
import { 
  Plus, 
  FileText, 
  Users, 
  Eye, 
  Calendar,
  TrendingUp 
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, currentTeam } = useAuthStore();

  // Fetch user's PRDs
  const { data: prdData, isLoading } = useQuery({
    queryKey: ['userPRDs', { page: 1, limit: 10 }],
    queryFn: () => prdService.getUserPRDs({ page: 1, limit: 10 }),
  });

  const prds = prdData?.data || [];
  const totalPRDs = prdData?.pagination?.total || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-300">
          {currentTeam 
            ? `Working in ${currentTeam.name} team workspace`
            : 'Working in your personal workspace'
          }
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total PRDs</p>
              <p className="text-2xl font-bold text-white">{totalPRDs}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Team Members</p>
              <p className="text-2xl font-bold text-white">
                {currentTeam ? '5' : '1'}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Views</p>
              <p className="text-2xl font-bold text-white">1.2k</p>
            </div>
            <Eye className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">This Month</p>
              <p className="text-2xl font-bold text-white">+24%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/prd/create"
            className="glass-button-primary p-4 rounded-lg text-center hover:scale-105 transition-transform"
          >
            <Plus className="h-6 w-6 mx-auto mb-2" />
            <span className="font-medium">Create New PRD</span>
          </Link>

          <Link
            to="/gallery"
            className="glass-button-secondary p-4 rounded-lg text-center hover:scale-105 transition-transform"
          >
            <Eye className="h-6 w-6 mx-auto mb-2" />
            <span className="font-medium">Browse Templates</span>
          </Link>

          {!currentTeam && (
            <button
              className="glass-button-secondary p-4 rounded-lg text-center hover:scale-105 transition-transform"
              onClick={() => {
                // TODO: Open create team modal
              }}
            >
              <Users className="h-6 w-6 mx-auto mb-2" />
              <span className="font-medium">Create Team</span>
            </button>
          )}
        </div>
      </div>

      {/* Recent PRDs */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent PRDs</h2>
          <Link
            to="/dashboard?tab=all"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse glass p-4 rounded-lg">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : prds.length > 0 ? (
          <div className="space-y-4">
            {prds.slice(0, 5).map((prd) => (
              <Link
                key={prd.id}
                to={`/prd/${prd.id}`}
                className="block glass p-4 rounded-lg hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1">{prd.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(prd.updated_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {prd.view_count || 0} views
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        prd.visibility === 'public' 
                          ? 'bg-green-600/30 text-green-200' 
                          : prd.visibility === 'team'
                          ? 'bg-blue-600/30 text-blue-200'
                          : 'bg-gray-600/30 text-gray-200'
                      }`}>
                        {prd.visibility}
                      </span>
                    </div>
                  </div>
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No PRDs yet
            </h3>
            <p className="text-gray-400 mb-4">
              Get started by creating your first PRD
            </p>
            <Link
              to="/prd/create"
              className="glass-button-primary px-6 py-2 font-medium"
            >
              Create Your First PRD
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};