import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, Plus, FileText, Loader2, Search, Calendar, User as UserIcon } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { prdService } from "../../services/prdService";
import PRDCard from "../prd/PRDCard";
import { PRDFilters } from "../../types/prd";
import { PRDWithAuthor } from "../../services/prdService";

const TeamPRDLibrary: React.FC = () => {
  const { currentTeam } = useAuthStore();
  const [filters, setFilters] = useState<PRDFilters>({
    search: '',
    author: '',
    dateFrom: '',
    dateTo: ''
  });

  const { data: prdsData, isLoading, error } = useQuery({
    queryKey: ['teamPRDs', currentTeam?.id, filters],
    queryFn: () => prdService.getTeamPRDs(currentTeam!.id, filters),
    enabled: !!currentTeam,
  });

  const prds: PRDWithAuthor[] = prdsData?.data || [];

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No team selected</p>
          <p className="text-sm text-gray-400">Switch to a team to view shared PRDs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team PRDs</h1>
          <p className="text-gray-600 mt-1">Shared PRDs in {currentTeam.name}</p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create PRD
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search PRDs
            </label>
            <input
              type="text"
              placeholder="Search titles and content..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="w-4 h-4 inline mr-1" />
              Author
            </label>
            <input
              type="text"
              placeholder="Filter by author..."
              value={filters.author}
              onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', author: '', dateFrom: '', dateTo: '' })}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* PRD Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading team PRDs...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <FileText className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Error loading PRDs</p>
            <p className="text-sm text-gray-600 mt-1">Please try again later</p>
          </div>
        </div>
      ) : prds.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No PRDs found</h3>
          <p className="text-gray-500 mb-6">
            {Object.values(filters).some(filter => filter) 
              ? "No PRDs match your current filters" 
              : "Your team hasn't created any shared PRDs yet"}
          </p>
          <Link
            to="/create"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create your first team PRD
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {prds.length} PRD{prds.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prds.map(prd => (
              <PRDCard key={prd.id} prd={prd} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPRDLibrary;