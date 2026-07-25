import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { Profile, UserRole } from '@/types/database';

type SessionState = {
  /** undefined = still restoring from storage; null = signed out. */
  session: Session | null | undefined;
  /** undefined = not loaded yet; null = authenticated but no profile row (needs onboarding). */
  profile: Profile | null | undefined;
  /** Role picked on the welcome screen, used when creating the profile row. */
  pendingRole: UserRole | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null | undefined) => void;
  setPendingRole: (role: UserRole | null) => void;
  reset: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  session: undefined,
  profile: undefined,
  pendingRole: null,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setPendingRole: (pendingRole) => set({ pendingRole }),
  reset: () => set({ session: null, profile: null, pendingRole: null }),
}));
