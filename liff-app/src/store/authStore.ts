import { create } from 'zustand';
import { LiffProfile } from '@/lib/liff';

interface AuthState {
  profile: LiffProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLinked: boolean;
  linkingToken: string | null;
  setProfile: (profile: LiffProfile | null) => void;
  setAuthenticated: (value: boolean) => void;
  setInitialized: (value: boolean) => void;
  setLinked: (value: boolean) => void;
  setLinkingToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isAuthenticated: false,
  isInitialized: false,
  isLinked: false,
  linkingToken: null,

  setProfile: (profile) => set({ profile }),

  setAuthenticated: (value) => set({ isAuthenticated: value }),

  setInitialized: (value) => set({ isInitialized: value }),

  setLinked: (value) => set({ isLinked: value }),

  setLinkingToken: (token) => set({ linkingToken: token }),

  logout: () => set({
    profile: null,
    isAuthenticated: false,
    isLinked: false,
    linkingToken: null
  }),
}));
