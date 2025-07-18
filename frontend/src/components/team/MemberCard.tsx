import { useState } from 'react';
import { 
  Crown, 
  ShieldCheck, 
  User, 
  MoreVertical, 
  Settings, 
  UserX, 
  Calendar,
  Clock,
  TrendingUp,
  Mail
} from 'lucide-react';
import { TeamMember } from '../../types/team';
import { memberService } from '../../services/memberService';

interface MemberCardProps {
  member: TeamMember;
  currentUserRole: string;
  currentUserId?: string;
  onRoleChange: () => void;
  onRemove: () => void;
}

export default function MemberCard({
  member,
  currentUserRole,
  currentUserId,
  onRoleChange,
  onRemove,
}: MemberCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const isCurrentUser = member.user_id === currentUserId;
  const canChangeRole = memberService.canChangeSpecificRole(currentUserRole, member.role) && !isCurrentUser;
  const canRemove = memberService.canRemoveSpecificMember(currentUserRole, member.role) && !isCurrentUser;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-400" />;
      case 'admin':
        return <ShieldCheck className="h-4 w-4 text-blue-400" />;
      default:
        return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'admin':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between">
        {/* Member Info */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Avatar */}
          <div className="relative">
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.name || member.email}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-lg">
                  {(member.name || member.email || '?').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {member.is_active && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h3 className="font-medium text-white truncate">
                {member.name || member.email}
                {isCurrentUser && (
                  <span className="ml-2 text-sm text-purple-300">(You)</span>
                )}
              </h3>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getRoleBadgeColor(member.role)}`}>
                {getRoleIcon(member.role)}
                <span className="capitalize">{member.role}</span>
              </div>
            </div>
            
            {member.email && member.name && (
              <div className="flex items-center space-x-1 mt-1">
                <Mail className="h-3 w-3 text-white/50" />
                <p className="text-sm text-white/70 truncate">{member.email}</p>
              </div>
            )}

            {/* Activity Stats */}
            <div className="flex items-center space-x-4 mt-2 text-xs text-white/50">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Joined {formatDate(member.joined_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Active {formatRelativeTime(member.last_active_at)}</span>
              </div>
              {(member.total_prds_created > 0 || member.total_prds_edited > 0) && (
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{member.total_prds_created + member.total_prds_edited} PRDs</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {(canChangeRole || canRemove) && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 rounded-lg border border-white/10 shadow-xl z-20">
                  {canChangeRole && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onRoleChange();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 rounded-t-lg flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Change Role</span>
                    </button>
                  )}
                  {canRemove && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onRemove();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-b-lg flex items-center space-x-2"
                    >
                      <UserX className="h-4 w-4" />
                      <span>Remove Member</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}