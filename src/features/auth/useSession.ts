import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/session';

import { fetchProfile } from './api';

/**
 * Boot-time session wiring, mounted once in the root layout:
 *  1. restores the persisted session from SecureStore
 *  2. subscribes to auth state changes
 *  3. loads the profile row whenever the user changes
 * Route guards react to the store; nothing else touches supabase.auth directly.
 */
export function useSessionListener(): void {
  const setSession = useSessionStore((s) => s.setSession);
  const setProfile = useSessionStore((s) => s.setProfile);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.subscription.unsubscribe();
  }, [setSession]);

  const userId = useSessionStore((s) => s.session?.user.id);

  useEffect(() => {
    if (!userId) {
      setProfile(userId === undefined ? undefined : null);
      return;
    }
    let cancelled = false;
    void fetchProfile(userId)
      .then((profile) => {
        if (!cancelled) setProfile(profile);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, setProfile]);
}

/** Convenience selectors for guards and screens. */
export function useAuthState() {
  const session = useSessionStore((s) => s.session);
  const profile = useSessionStore((s) => s.profile);
  return {
    restoring: session === undefined || (session !== null && profile === undefined),
    signedIn: Boolean(session),
    profile: profile ?? null,
    role: profile?.role ?? null,
  };
}
