/**
 * FILE: authContext.ts
 * DESCRIPTION: Auth context object and shared type. No components, so Fast
 *              Refresh stays happy and both the provider and the hook can
 *              import from here without a circular dependency.
 *
 * LAST UPDATED: 2026-09-25 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { Session } from '@supabase/supabase-js';

// -------------------- Module imports --------------------
import { createContext } from 'react';

// -------------------- Auth State Interface --------------------
export interface AuthState {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// -------------------- Create Auth Context --------------------
export const AuthContext = createContext<AuthState | null>(null);
