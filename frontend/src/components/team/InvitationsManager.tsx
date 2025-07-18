import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Mail, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle,
  MoreVertical,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { TeamInvitation } from '../../types/team';
import { memberService } from '../../services/memberService';
import { toast } from 'react-hot-toast';

interface InvitationsManagerProps {
  invitations: TeamInvitation[];
  isLoading: boolean;
  teamId: string;
}

export default function InvitationsManager({ 
  invitations, 
  isLoading, 
  teamId 
}: InvitationsManagerProps) {
  const [selectedInvitation, setSelectedInvitation] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const resendMutation = useMutation({
    mutationFn: (invitationId: string) => 
      memberService.resendInvitation(teamId, invitationId),
    onSuccess: () => {
      toast.success('Invitation resent successfully');
      queryClient.invalidateQueries({ queryKey: ['teamInvitations', teamId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to resend invitation');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) => 
      memberService.cancelInvitation(teamId, invitationId),
    onSuccess: () => {
      toast.success('Invitation cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['teamInvitations', teamId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel invitation');
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-400" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <Mail className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'accepted':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'declined':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'expired':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="h-12 w-12 text-white/30 mx-auto mb-4" />
        <p className="text-white/70">No invitations sent</p>
        <p className="text-sm text-white/50 mt-1">
          Invite new members to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center justify-between">
            {/* Invitation Info */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <Mail className="h-5 w-5 text-purple-300" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <h3 className="font-medium text-white truncate">
                    {invitation.email}
                  </h3>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(invitation.status)}`}>
                    {getStatusIcon(invitation.status)}
                    <span className="capitalize">{invitation.status}</span>
                  </div>
                  <div className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                    {invitation.role}
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-1 text-sm text-white/70">
                  <span>
                    Invited by {invitation.invited_by_name || invitation.invited_by_email}
                  </span>
                  <span>•</span>
                  <span>
                    {formatDate(invitation.created_at)}
                  </span>
                  {invitation.status === 'pending' && (
                    <>
                      <span>•</span>
                      <span className={isExpired(invitation.expires_at) ? 'text-red-400' : ''}>
                        Expires {formatDate(invitation.expires_at)}
                      </span>
                    </>
                  )}
                </div>

                {invitation.message && (
                  <p className="text-sm text-white/60 mt-2 italic">
                    "{invitation.message}"
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            {invitation.status === 'pending' && (
              <div className="relative">
                <button
                  onClick={() => setSelectedInvitation(
                    selectedInvitation === invitation.id ? null : invitation.id
                  )}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {selectedInvitation === invitation.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setSelectedInvitation(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 rounded-lg border border-white/10 shadow-xl z-20">
                      <button
                        onClick={() => {
                          setSelectedInvitation(null);
                          resendMutation.mutate(invitation.id);
                        }}
                        disabled={resendMutation.isPending}
                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 rounded-t-lg flex items-center space-x-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Resend</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInvitation(null);
                          cancelMutation.mutate(invitation.id);
                        }}
                        disabled={cancelMutation.isPending}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-b-lg flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}