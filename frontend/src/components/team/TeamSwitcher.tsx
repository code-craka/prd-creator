import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { teamService } from '../../services/teamService';
import { ChevronDown, Plus, Users, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

export const TeamSwitcher: React.FC = () => {
  const { user, currentTeam, setCurrentTeam } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user teams
  const { data: teams = [] } = useQuery({
    queryKey: ['userTeams'],
    queryFn: () => teamService.getUserTeams(),
    enabled: !!user,
  });

  // Switch team mutation
  const switchTeamMutation = useMutation({
    mutationFn: (teamId: string) => teamService.switchTeam(teamId),
    onSuccess: (team) => {
      setCurrentTeam(team);
      setIsOpen(false);
      toast.success(`Switched to ${team.name}`);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: () => {
      toast.error('Failed to switch team');
    },
  });

  const handleSwitchTeam = (teamId: string) => {
    if (teamId !== currentTeam?.id) {
      switchTeamMutation.mutate(teamId);
    }
  };

  if (!teams.length) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 glass rounded-lg hover:bg-white/20 transition-colors"
      >
        <Users className="h-4 w-4 text-gray-300" />
        <span className="text-white font-medium hidden sm:block">
          {currentTeam?.name || 'Personal'}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-300 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 glass-card z-20">
            <div className="py-2">
              {/* Personal workspace */}
              <button
                onClick={() => {
                  setCurrentTeam(null);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-left hover:bg-white/10 transition-colors",
                  !currentTeam && "bg-blue-600/30"
                )}
              >
                <div className="flex items-center flex-1">
                  <div className="h-8 w-8 rounded bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center mr-3">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Personal</div>
                    <div className="text-gray-400 text-xs">Your private workspace</div>
                  </div>
                </div>
                {!currentTeam && (
                  <Check className="h-4 w-4 text-blue-400" />
                )}
              </button>

              {/* Teams */}
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleSwitchTeam(team.id)}
                  disabled={switchTeamMutation.isPending}
                  className={cn(
                    "flex items-center w-full px-4 py-2 text-left hover:bg-white/10 transition-colors disabled:opacity-50",
                    currentTeam?.id === team.id && "bg-blue-600/30"
                  )}
                >
                  <div className="flex items-center flex-1">
                    {team.avatar_url ? (
                      <img 
                        src={team.avatar_url} 
                        alt={team.name}
                        className="h-8 w-8 rounded object-cover mr-3"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                        <span className="text-white font-medium text-sm">
                          {team.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="text-white font-medium">{team.name}</div>
                      <div className="text-gray-400 text-xs">{team.role}</div>
                    </div>
                  </div>
                  {currentTeam?.id === team.id && (
                    <Check className="h-4 w-4 text-blue-400" />
                  )}
                </button>
              ))}

              {/* Create team */}
              <div className="border-t border-gray-300/20 mt-2 pt-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: Open create team modal
                  }}
                  className="flex items-center w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-3" />
                  Create Team
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};