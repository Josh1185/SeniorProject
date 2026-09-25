/**
 * FILE: useAuth.ts
 * DESCRIPTION: Universal authentication/authorization context hook
 *
 * LAST UPDATED: 2026-09-25 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { AuthState } from "./authContext";

// -------------------- Module imports --------------------
import { AuthContext } from "./authContext";
import { use } from "react";

// -------------------- Export useAuth hook --------------------
export function useAuth(): AuthState {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
