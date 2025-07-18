import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Edit3, 
  Users, 
  Crown, 
  AlertTriangle,
  Camera,
  Save,
  X,
  Trash2,
  ArrowRightLeft
} from 'lucide-react';
import { teamService } from '../../services/teamService';
import { useAuthStore } from '../../stores/authStore';
import { Team, UpdateTeamRequest } from '../../types/team';
import { toast } from 'react-hot-toast';
import TransferOwnershipModal from './TransferOwnershipModal';
import DeleteTeamModal from './DeleteTeamModal';

interface TeamSettingsProps {
  teamId: string;
}

export default function TeamSettings({ teamId }: TeamSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState<UpdateTeamRequest>({});
  
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['teamSettings', teamId],
    queryFn: () => teamService.getTeamSettings(teamId),
    enabled: !!teamId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTeamRequest) => teamService.updateTeam(teamId, data),
    onSuccess: (_updatedTeam: Team) => {
      toast.success('Team updated successfully');
      setIsEditing(false);
      setFormData({});
      queryClient.invalidateQueries({ queryKey: ['teamSettings', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update team');
    },
  });

  const handleEdit = () => {
    setFormData({
      name: settings?.team.name || '',
      description: settings?.team.description || '',
      avatar_url: settings?.team.avatar_url || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast.error('Team name is required');
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const isOwner = user?.id === settings?.team.owner_id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <Settings className="h-12 w-12 text-white/30 mx-auto mb-4" />
        <p className="text-white/70">Team settings not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Team Settings</h2>
          <p className="text-white/70">
            Manage your team configuration and preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
            <Users className="h-4 w-4 text-white/70" />
            <span className="text-sm text-white/70">
              {settings.memberCount} {settings.memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">General</h3>
              <p className="text-sm text-white/70">Basic team information and settings</p>
            </div>
            {!isEditing && (isOwner || user?.id) && (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Team Avatar */}
          <div className="flex items-start space-x-4">
            <div className="relative">
              {settings.team.avatar_url ? (
                <img
                  src={isEditing ? formData.avatar_url || settings.team.avatar_url : settings.team.avatar_url}
                  alt={settings.team.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {settings.team.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {isEditing && (
                <button className="absolute inset-0 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center transition-colors">
                  <Camera className="h-5 w-5 text-white" />
                </button>
              )}
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-white mb-2">
                Team Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter team name"
                />
              ) : (
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
                  <span className="text-white">{settings.team.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Team Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Describe your team's purpose and goals"
              />
            ) : (
              <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg min-h-[80px]">
                <span className="text-white/70">
                  {settings.team.description || 'No description added yet'}
                </span>
              </div>
            )}
          </div>

          {/* Avatar URL (if editing) */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Avatar URL (Optional)
              </label>
              <input
                type="url"
                value={formData.avatar_url || ''}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          )}

          {/* Team Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Team Owner
              </label>
              <div className="flex items-center space-x-2">
                <Crown className="h-4 w-4 text-yellow-400" />
                <span className="text-white">{settings.ownerName}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Created
              </label>
              <span className="text-white">
                {new Date(settings.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Owner Actions */}
      {isOwner && (
        <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white mb-1">Owner Actions</h3>
            <p className="text-sm text-white/70">
              Advanced team management options (owner only)
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Transfer Ownership */}
            <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <ArrowRightLeft className="h-5 w-5 text-blue-400" />
                <div>
                  <h4 className="font-medium text-white">Transfer Ownership</h4>
                  <p className="text-sm text-white/70">
                    Transfer team ownership to another member
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTransferModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      {isOwner && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-red-500/20">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Danger Zone</h3>
            </div>
            <p className="text-sm text-white/70 mt-1">
              Irreversible and destructive actions
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Trash2 className="h-5 w-5 text-red-400" />
                <div>
                  <h4 className="font-medium text-white">Delete Team</h4>
                  <p className="text-sm text-white/70">
                    Permanently delete this team and all its data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showTransferModal && (
        <TransferOwnershipModal
          teamId={teamId}
          onClose={() => setShowTransferModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteTeamModal
          team={settings.team}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}