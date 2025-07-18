// ActivityFeed component
import { 
  Activity, 
  UserPlus, 
  UserX, 
  Shield, 
  FileText, 
  Edit3, 
  MessageSquare,
  Settings,
  Clock
} from 'lucide-react';
import { MemberActivityLog } from '../../types/team';

interface ActivityFeedProps {
  activities: MemberActivityLog[];
  isLoading: boolean;
}

export default function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'joined':
        return <UserPlus className="h-4 w-4 text-green-400" />;
      case 'member_removed':
        return <UserX className="h-4 w-4 text-red-400" />;
      case 'role_changed':
        return <Shield className="h-4 w-4 text-blue-400" />;
      case 'prd_created':
        return <FileText className="h-4 w-4 text-purple-400" />;
      case 'prd_edited':
        return <Edit3 className="h-4 w-4 text-yellow-400" />;
      case 'commented':
        return <MessageSquare className="h-4 w-4 text-gray-400" />;
      case 'invitation_sent':
        return <UserPlus className="h-4 w-4 text-blue-400" />;
      case 'invitation_resent':
        return <UserPlus className="h-4 w-4 text-blue-400" />;
      case 'invitation_cancelled':
        return <UserX className="h-4 w-4 text-gray-400" />;
      case 'team_settings_updated':
        return <Settings className="h-4 w-4 text-purple-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'joined':
        return 'border-green-500/30';
      case 'member_removed':
        return 'border-red-500/30';
      case 'role_changed':
        return 'border-blue-500/30';
      case 'prd_created':
        return 'border-purple-500/30';
      case 'prd_edited':
        return 'border-yellow-500/30';
      case 'invitation_sent':
        return 'border-blue-500/30';
      default:
        return 'border-gray-500/30';
    }
  };

  const formatActivityMessage = (activity: MemberActivityLog) => {
    const metadata = activity.metadata ? JSON.parse(activity.metadata) : {};
    const userName = activity.user_name || activity.user_email || 'Unknown user';

    switch (activity.action) {
      case 'joined':
        return `${userName} joined the team as ${metadata.role}`;
      case 'member_removed':
        return `${userName} removed a team member${metadata.reason ? ` (${metadata.reason})` : ''}`;
      case 'role_changed':
        return `${userName}'s role was changed from ${metadata.old_role} to ${metadata.new_role}`;
      case 'prd_created':
        return `${userName} created a new PRD`;
      case 'prd_edited':
        return `${userName} edited a PRD`;
      case 'commented':
        return `${userName} added a comment`;
      case 'invitation_sent':
        return `${userName} sent an invitation to ${metadata.email} as ${metadata.role}`;
      case 'invitation_resent':
        return `${userName} resent an invitation to ${metadata.email}`;
      case 'invitation_cancelled':
        return `${userName} cancelled an invitation to ${metadata.email}`;
      case 'team_settings_updated':
        return `${userName} updated team settings`;
      default:
        return `${userName} performed ${activity.action}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-white/30 mx-auto mb-4" />
        <p className="text-white/70">No recent activity</p>
        <p className="text-sm text-white/50 mt-1">
          Team activity will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Recent Activity</h3>
        <div className="flex items-center space-x-1 text-sm text-white/50">
          <Clock className="h-4 w-4" />
          <span>Last {activities.length} activities</span>
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`flex items-start space-x-3 p-3 bg-white/5 rounded-lg border ${getActivityColor(activity.action)} hover:bg-white/10 transition-colors`}
          >
            {/* Icon */}
            <div className="p-2 bg-white/10 rounded-lg border border-white/20 mt-0.5">
              {getActivityIcon(activity.action)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white leading-relaxed">
                {formatActivityMessage(activity)}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-white/50">
                  {formatDate(activity.created_at)}
                </span>
                {activity.target_resource_type && (
                  <>
                    <span className="text-xs text-white/30">•</span>
                    <span className="text-xs text-white/50 capitalize">
                      {activity.target_resource_type}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Time indicator for recent activities */}
            {index < 3 && (
              <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
            )}
          </div>
        ))}
      </div>

      {activities.length >= 50 && (
        <div className="text-center pt-4">
          <p className="text-sm text-white/50">
            Showing recent 50 activities
          </p>
        </div>
      )}
    </div>
  );
}