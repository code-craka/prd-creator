import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Team } from '../types/team';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  current_team_id?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  currentTeam: Team | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  setAuth: (user: User, token: string) => void;
  setCurrentTeam: (team: Team | null) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  currentTeam: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAuth: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setCurrentTeam: (team) => {
        set({ currentTeam: team });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },

      logout: () => {
        set(initialState);
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'prd-auth-storage',
      partialize: (state) => ({
        user: state.user,
        currentTeam: state.currentTeam,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);