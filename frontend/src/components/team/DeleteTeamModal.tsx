import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  Trash2, 
  AlertTriangle,
  Users,
  FileText,
  Database
} from 'lucide-react';
import { teamService } from '../../services/teamService';
import { Team, DeleteTeamRequest } from '../../types/team';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface DeleteTeamModalProps {
  team: Team;
  onClose: () => void;
}

export default function DeleteTeamModal({ team, onClose }: DeleteTeamModalProps) {
  const [confirmName, setConfirmName] = useState('');
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (data: DeleteTeamRequest) => 
      teamService.deleteTeamWithReason(team.id, data),
    onSuccess: () => {
      toast.success('Team deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onClose();
      // Redirect to dashboard as team no longer exists
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete team');
    },
  });

  const handleDelete = () => {
    if (confirmName !== team.name) {
      toast.error(`Please type "${team.name}" exactly to confirm`);
      return;
    }

    deleteMutation.mutate({
      confirmName,
      reason: reason.trim() || 'Team deletion'
    });
  };

  const canProceed = confirmName === team.name;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-red-500/20 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Delete Team</h2>
              <p className="text-sm text-white/70">
                This action cannot be undone
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
          {step === 'warning' ? (
            <>
              {/* Warning */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-300 mb-2">This will permanently delete:</h3>
                    <ul className="space-y-2 text-sm text-red-200/80">
                      <li className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>All team members and invitations</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>All PRDs and templates</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Database className="h-4 w-4" />
                        <span>All team data and activity history</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Team Info */}
              <div className="bg-white/5 rounded-lg border border-white/10 p-4 mb-6">
                <div className="flex items-center space-x-3">
                  {team.avatar_url ? (
                    <img
                      src={team.avatar_url}
                      alt={team.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {team.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-white">{team.name}</h3>
                    {team.description && (
                      <p className="text-sm text-white/70">{team.description}</p>
                    )}
                    <p className="text-xs text-white/50 mt-1">
                      Created {new Date(team.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
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
                  onClick={() => setStep('confirm')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Confirmation Step */}
              <div className="mb-6">
                <p className="text-white mb-4">
                  To confirm deletion, please type the team name:{' '}
                  <span className="font-mono bg-white/10 px-2 py-1 rounded text-purple-300">
                    {team.name}
                  </span>
                </p>
                
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={team.name}
                  autoFocus
                />
              </div>

              {/* Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Reason for deletion (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Why are you deleting this team?"
                />
              </div>

              {/* Final Warning */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-200 text-center">
                  ⚠️ This action is permanent and cannot be undone
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setStep('warning')}
                  className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!canProceed || deleteMutation.isPending}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Team'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}