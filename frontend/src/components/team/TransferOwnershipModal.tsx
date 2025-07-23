import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  Crown, 
  ArrowRightLeft, 
  AlertTriangle,
  User,
  ShieldCheck
} from 'lucide-react';
import { teamService } from '../../services/teamService';
import { memberService } from '../../services/memberService';
import { TransferOwnershipRequest } from 'prd-creator-shared';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface TransferOwnershipModalProps {
  teamId: string;
  onClose: () => void;
}

export default function TransferOwnershipModal({ teamId, onClose }: TransferOwnershipModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [reason, setReason] = useState('');
  const [confirmName, setConfirmName] = useState('');
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: () => memberService.getTeamMembersWithActivity(teamId),
    enabled: !!teamId,
  });

  const transferMutation = useMutation({
    mutationFn: (data: TransferOwnershipRequest) => 
      teamService.transferOwnership(teamId, data),
    onSuccess: () => {
      toast.success('Ownership transferred successfully');
      queryClient.invalidateQueries({ queryKey: ['teamSettings', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onClose();
      // Redirect to team dashboard as user is no longer owner
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to transfer ownership');
    },
  });

  const handleTransfer = () => {
    if (!selectedMemberId) {
      toast.error('Please select a new owner');
      return;
    }

    if (confirmName.toLowerCase() !== 'transfer ownership') {
      toast.error('Please type "transfer ownership" to confirm');
      return;
    }

    transferMutation.mutate({
      newOwnerId: selectedMemberId,
      reason: reason.trim() || 'Ownership transfer'
    });
  };

  // Filter out current owner and get eligible members (admins and members)
  const eligibleMembers = members.filter(member => member.role !== 'owner');
  const selectedMember = members.find(m => m.user_id === selectedMemberId);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="h-4 w-4 text-blue-400" />;
      default:
        return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-white/10 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
              <ArrowRightLeft className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Transfer Ownership</h2>
              <p className="text-sm text-white/70">
                Choose a new team owner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-300 mb-1">Important Notice</h3>
                <p className="text-sm text-yellow-200/80">
                  Once you transfer ownership, you will become an admin and lose owner privileges. 
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Select New Owner */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3">
              Select New Owner
            </label>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              </div>
            ) : eligibleMembers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-8 w-8 text-white/30 mx-auto mb-2" />
                <p className="text-white/70 text-sm">No eligible members found</p>
                <p className="text-white/50 text-xs mt-1">
                  You need at least one other team member to transfer ownership
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {eligibleMembers.map((member) => (
                  <label
                    key={member.user_id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedMemberId === member.user_id
                        ? 'bg-purple-500/20 border-purple-500/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="newOwner"
                      value={member.user_id}
                      checked={selectedMemberId === member.user_id}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="text-purple-600 bg-transparent border-white/30 focus:ring-purple-500"
                    />
                    
                    {/* Avatar */}
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name || member.email}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {(member.name || member.email || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white truncate">
                          {member.name || member.email}
                        </span>
                        <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs border ${getRoleBadgeColor(member.role)}`}>
                          {getRoleIcon(member.role)}
                          <span className="capitalize">{member.role}</span>
                        </div>
                      </div>
                      {member.email && member.name && (
                        <p className="text-sm text-white/70 truncate">{member.email}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Why are you transferring ownership?"
            />
          </div>

          {/* Confirmation */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Type "transfer ownership" to confirm
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="transfer ownership"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              disabled={
                !selectedMemberId || 
                confirmName.toLowerCase() !== 'transfer ownership' ||
                transferMutation.isPending
              }
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Crown className="h-4 w-4" />
              <span>
                {transferMutation.isPending ? 'Transferring...' : 'Transfer Ownership'}
              </span>
            </button>
          </div>

          {/* Preview */}
          {selectedMember && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-white/70 mb-2">New Owner:</p>
              <div className="flex items-center space-x-3">
                <Crown className="h-4 w-4 text-yellow-400" />
                <span className="text-white font-medium">
                  {selectedMember.name || selectedMember.email}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}