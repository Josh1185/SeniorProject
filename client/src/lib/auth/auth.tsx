/**
 * FILE: auth.tsx
 * DESCRIPTION: Universal authentication/authorization context provider
 *
 * LAST UPDATED: 2026-09-25 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import type { AuthState } from './authContext';

// -------------------- Module and lib imports --------------------
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { AuthContext } from './authContext';

// -------------------- Auth Context Provider --------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  // ----- 1. State Management -----
  // Session state and loading state
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // ----- 2. Effects -----
  useEffect(() => {
    // Read whatever is already in storage first, so a refresh doesn't flash
    // the login screen before restoring the session.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Then subscribe: fires on sign-in, sign-out, and token refresh
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    // Cleanup on unmount, or a listener will leak on every hot reload
    return () => data.subscription.unsubscribe();
  }, []);

  // ----- 3. Bundle authState value to build into the provider and return it -----
  const value: AuthState = {
    session,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}
