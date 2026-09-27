/**
 * FILE: ProtectedRoute.tsx
 * DESCRIPTION: Auth session-check wrapper for protected routes
 *
 *              This is convenience, not security. Anyone can edit their
 *              JavaScript settings and render whatever component they like.
 *              The real protection is requireAuth on the server, but this just
 *              avoids showing a broken page to someone who isn't signed in.
 *
 * LAST UPDATED: 2026-09-26 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ReactNode } from 'react';

// -------------------- Module and lib imports --------------------
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../lib/auth/useAuth';

// -------------------- Component --------------------
export function ProtectedRoute({ children }: { children: ReactNode }) {
  // ----- 1. Auth/Location state -----
  const { session, loading } = useAuth();
  const location = useLocation();

  // ----- 2. Wait for session to load before checking it -----
  if (loading) {
    return <div className="grid h-full place-items-center text-slate-500">Loading…</div>;
  }

  // ----- 3. Navigate back to login if session does not exist -----
  if (!session) {
    // `replace` keeps /login out of the back-button history
    // `state` remembers where the user was header, so that they can be directed back upon login
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // ----- 4. All checks pass, render the child component -----
  return <>{children}</>;
}
