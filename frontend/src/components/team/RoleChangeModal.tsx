import React, { useState } from 'react';
import { X, Shield, AlertTriangle } from 'lucide-react';
import { TeamMember } from 'prd-creator-shared';

interface RoleChangeModalProps {
  member: TeamMember;
  onClose: () => void;
  onConfirm: (role: 'admin' | 'member', reason?: string) => void;
  isLoading: boolean;
}

export default function RoleChangeModal({ 
  member, 
  onClose, 
  onConfirm, 
  isLoading 
}: RoleChangeModalProps) {
  const [newRole, setNewRole] = useState<'admin' | 'member'>(
    member.role === 'admin' ? 'member' : 'admin'
  );
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(newRole, reason.trim() || undefined);
  };

  const getRoleDescription = (role: 'admin' | 'member') => {
    switch (role) {
      case 'admin':
        return 'Admins can invite members, manage PRDs, and view team analytics.';
      case 'member':
        return 'Members can create and edit PRDs but cannot manage team settings.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-white/10 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Shield className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Change Member Role</h2>
              <p className="text-sm text-white/70">Update {member.name || member.email}'s permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Role */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Current Role</p>
                <p className="text-white font-medium capitalize">{member.role}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/70">Since</p>
                <p className="text-white font-medium">
                  {member.joined_at 
                    ? new Date(member.joined_at).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* New Role Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              New Role
            </label>
            <div className="space-y-3">
              {(['admin', 'member'] as const).map((role) => (
                <label
                  key={role}
                  className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    newRole === role
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={newRole === role}
                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'member')}
                    className="mt-1 text-purple-600 bg-transparent border-white/20 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white capitalize">{role}</p>
                    <p className="text-sm text-white/70 mt-1">
                      {getRoleDescription(role)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Reason for Change <span className="text-white/50">(Optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-none"
              placeholder="Explain why you're changing this member's role..."
              disabled={isLoading}
            />
          </div>

          {/* Warning */}
          {member.role === 'admin' && newRole === 'member' && (
            <div className="flex items-start space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-300">Removing Admin Privileges</p>
                <p className="text-sm text-yellow-200/80 mt-1">
                  This member will lose the ability to invite new members and manage team settings.
                </p>
              </div>
            </div>
          )}

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
              disabled={isLoading || newRole === member.role}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Update Role</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}