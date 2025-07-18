import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { 
  LayoutDashboard,
  FileText,
  Plus,
  Users,
  Share2,
  Archive,
  Star
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, label, badge }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center px-4 py-3 rounded-lg transition-colors group",
        isActive 
          ? "bg-blue-600/30 text-blue-200 border border-blue-400/30" 
          : "text-gray-300 hover:text-white hover:bg-white/10"
      )}
    >
      <Icon className="h-5 w-5 mr-3" />
      <span className="font-medium">{label}</span>
      {badge && badge > 0 && (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
          {badge}
        </span>
      )}
    </Link>
  );
};

export const Sidebar: React.FC = () => {
  const { currentTeam } = useAuthStore();

  return (
    <aside className="w-64 glass border-r border-gray-300/20 min-h-screen p-6">
      <nav className="space-y-2">
        {/* Main Navigation */}
        <div className="space-y-2">
          <SidebarItem
            to="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
          />
          
          <SidebarItem
            to="/prd/create"
            icon={Plus}
            label="Create PRD"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300/20 my-4"></div>

        {/* PRD Management */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
            My PRDs
          </h3>
          
          <SidebarItem
            to="/dashboard"
            icon={FileText}
            label="All PRDs"
          />
          
          <SidebarItem
            to="/dashboard?filter=shared"
            icon={Share2}
            label="Shared with Me"
            badge={3}
          />
          
          <SidebarItem
            to="/dashboard?filter=favorites"
            icon={Star}
            label="Favorites"
          />
          
          <SidebarItem
            to="/dashboard?filter=archived"
            icon={Archive}
            label="Archived"
          />
        </div>

        {/* Team Section */}
        {currentTeam && (
          <>
            <div className="border-t border-gray-300/20 my-4"></div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
                Team: {currentTeam.name}
              </h3>
              
              <SidebarItem
                to={`/team/${currentTeam.id}`}
                icon={Users}
                label="Team Overview"
              />
              
              <SidebarItem
                to={`/team/${currentTeam.id}?tab=prds`}
                icon={FileText}
                label="Team PRDs"
              />
              
              <SidebarItem
                to={`/team/${currentTeam.id}?tab=members`}
                icon={Users}
                label="Members"
              />
            </div>
          </>
        )}

        {/* Public Section */}
        <div className="border-t border-gray-300/20 my-4"></div>
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
            Community
          </h3>
          
          <SidebarItem
            to="/gallery"
            icon={Share2}
            label="Public Gallery"
          />
        </div>
      </nav>
    </aside>
  );
};