import React, { useState } from 'react';
import { X, UserX, AlertTriangle } from 'lucide-react';
import { TeamMember } from '../../types/team';

interface RemoveMemberModalProps {
  member: TeamMember;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  isLoading: boolean;
}

export default function RemoveMemberModal({ 
  member, 
  onClose, 
  onConfirm, 
  isLoading 
}: RemoveMemberModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-white/10 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30">
              <UserX className="h-5 w-5 text-red-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Remove Team Member</h2>
              <p className="text-sm text-white/70">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="flex items-start space-x-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">Confirm Member Removal</p>
              <p className="text-sm text-red-200/80 mt-1">
                You are about to remove <strong>{member.name || member.email}</strong> from the team. 
                They will lose access to all team PRDs and be unable to collaborate.
              </p>
            </div>
          </div>

          {/* Member Info */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-3">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.name || member.email}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {(member.name || member.email || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-white">{member.name || member.email}</p>
                <p className="text-sm text-white/70 capitalize">{member.role}</p>
              </div>
            </div>
            
            {/* Member Stats */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/50">Joined</p>
                <p className="text-white">
                  {member.joined_at 
                    ? new Date(member.joined_at).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>
              <div>
                <p className="text-white/50">PRDs Created/Edited</p>
                <p className="text-white">
                  {member.total_prds_created + member.total_prds_edited}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Reason for Removal <span className="text-white/50">(Optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors resize-none"
                placeholder="Explain why you're removing this member..."
                disabled={isLoading}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4" />
                    <span>Remove Member</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}