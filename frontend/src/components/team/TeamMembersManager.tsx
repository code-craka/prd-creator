import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  UserPlus, 
  Activity, 
  Mail
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { memberService } from '../../services/memberService';
import { TeamMember } from 'prd-creator-shared';
import { toast } from 'react-hot-toast';
import MemberCard from './MemberCard';
import InviteMemberModal from './InviteMemberModal';
import InvitationsManager from './InvitationsManager';
import ActivityFeed from './ActivityFeed';
import RoleChangeModal from './RoleChangeModal';
import RemoveMemberModal from './RemoveMemberModal';

interface TeamMembersManagerProps {
  className?: string;
}

type TabType = 'members' | 'invitations' | 'activity';

export default function TeamMembersManager({ className = '' }: TeamMembersManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const { currentTeam, user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const userRole = currentTeam?.role || 'member';

  const { 
    data: members = [], 
    isLoading: membersLoading,
    error: membersError 
  } = useQuery({
    queryKey: ['teamMembers', currentTeam?.id],
    queryFn: () => memberService.getTeamMembersWithActivity(currentTeam!.id),
    enabled: !!currentTeam,
  });

  const { 
    data: invitations = [], 
    isLoading: invitationsLoading 
  } = useQuery({
    queryKey: ['teamInvitations', currentTeam?.id],
    queryFn: () => memberService.getTeamInvitations(currentTeam!.id),
    enabled: !!currentTeam && memberService.canInviteMembers(userRole),
  });

  const { 
    data: activities = [], 
    isLoading: activitiesLoading 
  } = useQuery({
    queryKey: ['memberActivity', currentTeam?.id],
    queryFn: () => memberService.getMemberActivity(currentTeam!.id),
    enabled: !!currentTeam && activeTab === 'activity',
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role, reason }: { memberId: string; role: 'admin' | 'member'; reason?: string }) =>
      memberService.updateMemberRole(currentTeam!.id, memberId, { role, reason }),
    onSuccess: () => {
      toast.success('Member role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['teamMembers', currentTeam?.id] });
      setShowRoleModal(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update member role');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ memberId, reason }: { memberId: string; reason?: string }) =>
      memberService.removeMember(currentTeam!.id, memberId, { reason }),
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['teamMembers', currentTeam?.id] });
      setShowRemoveModal(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove member');
    },
  });

  const handleRoleChange = (member: TeamMember) => {
    setSelectedMember(member);
    setShowRoleModal(true);
  };

  const handleRemoveMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowRemoveModal(true);
  };

  const handleConfirmRoleChange = (role: 'admin' | 'member', reason?: string) => {
    if (selectedMember) {
      updateRoleMutation.mutate({
        memberId: selectedMember.user_id,
        role,
        reason,
      });
    }
  };

  const handleConfirmRemove = (reason?: string) => {
    if (selectedMember) {
      removeMemberMutation.mutate({
        memberId: selectedMember.user_id,
        reason,
      });
    }
  };

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-white/70">Please select a team to manage members.</p>
      </div>
    );
  }

  const tabConfig = [
    {
      key: 'members' as TabType,
      label: 'Members',
      icon: Users,
      count: members.length,
      visible: true,
    },
    {
      key: 'invitations' as TabType,
      label: 'Invitations',
      icon: Mail,
      count: invitations.length,
      visible: memberService.canInviteMembers(userRole),
    },
    {
      key: 'activity' as TabType,
      label: 'Activity',
      icon: Activity,
      count: activities.length,
      visible: ['owner', 'admin'].includes(userRole),
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <Users className="h-5 w-5 text-purple-300" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Team Members</h2>
            <p className="text-sm text-white/70">Manage your team members and permissions</p>
          </div>
        </div>

        {memberService.canInviteMembers(userRole) && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
        {tabConfig.filter(tab => tab.visible).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors flex-1 ${
              activeTab === tab.key
                ? 'bg-purple-600 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                activeTab === tab.key 
                  ? 'bg-white/20' 
                  : 'bg-white/10'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-6">
        {activeTab === 'members' && (
          <div className="space-y-4">
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : membersError ? (
              <div className="text-center py-8">
                <p className="text-red-400">Failed to load team members</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/70">No team members found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {members.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    currentUserRole={userRole}
                    currentUserId={currentUser?.id}
                    onRoleChange={() => handleRoleChange(member)}
                    onRemove={() => handleRemoveMember(member)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invitations' && (
          <InvitationsManager
            invitations={invitations}
            isLoading={invitationsLoading}
            teamId={currentTeam.id}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityFeed
            activities={activities}
            isLoading={activitiesLoading}
          />
        )}
      </div>

      {showInviteModal && (
        <InviteMemberModal
          teamId={currentTeam.id}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            queryClient.invalidateQueries({ queryKey: ['teamInvitations', currentTeam.id] });
          }}
        />
      )}

      {showRoleModal && selectedMember && (
        <RoleChangeModal
          member={selectedMember}
          onClose={() => {
            setShowRoleModal(false);
            setSelectedMember(null);
          }}
          onConfirm={handleConfirmRoleChange}
          isLoading={updateRoleMutation.isPending}
        />
      )}

      {showRemoveModal && selectedMember && (
        <RemoveMemberModal
          member={selectedMember}
          onClose={() => {
            setShowRemoveModal(false);
            setSelectedMember(null);
          }}
          onConfirm={handleConfirmRemove}
          isLoading={removeMemberMutation.isPending}
        />
      )}
    </div>
  );
}