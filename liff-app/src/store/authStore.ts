import { create } from 'zustand';
import { LiffProfile } from '@/lib/liff';

interface AuthState {
  profile: LiffProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setProfile: (profile: LiffProfile | null) => void;
  setAuthenticated: (value: boolean) => void;
  setInitialized: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isAuthenticated: false,
  isInitialized: false,

  setProfile: (profile) => set({ profile }),

  setAuthenticated: (value) => set({ isAuthenticated: value }),

  setInitialized: (value) => set({ isInitialized: value }),

  logout: () => set({ profile: null, isAuthenticated: false }),
}));
