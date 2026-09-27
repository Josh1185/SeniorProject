/**
 * FILE: LoginPage.tsx
 * DESCRIPTION: Login page via Supabase
 *
 * LAST UPDATED: 2026-09-26 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { useState, useActionState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../lib/auth/useAuth';
import { supabase } from '../lib/supabase';

// -------------------- Component imports --------------------
import { TextField } from '../components/TextField';

// -------------------- Component --------------------
export function LoginPage() {
  // ----- 1. Session and form state management -----
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // ----- 2. Form action state management -----
  const [error, submitAction, isPending] = useActionState(
    async (_previousError: string | null, formData: FormData) => {
      const password = String(formData.get('password') ?? '');

      const { error: authError } =
        mode === 'signup'
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });

      // Whatever you return becomes the new `error` value.
      return authError ? authError.message : null;
    },
    null,
  );

  // ----- 3. Check for existing session -----
  if (session) return <Navigate to="/dashboard" replace />;

  // ----- 4. Render -----
  return (
    <div className="grid h-full place-items-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">
          {mode === 'signup' ? 'Create an account' : 'Sign in'}
        </h1>

        <form action={submitAction} className="mt-6 space-y-4">
          <TextField
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField label="Password" type="password" name="password" required minLength={6} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {isPending ? 'Working…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
          className="mt-4 text-sm text-slate-500 hover:text-slate-900"
        >
          {mode === 'signup' ? 'Already have an account?' : 'Need an account?'}
        </button>
      </div>
    </div>
  );
}
