/**
 * FILE: LoginPage.tsx
 * DESCRIPTION: Email + password sign in via Supabase.
 *
 *              Split from Register, which used to share this file behind a
 *              mode toggle. Two routes means two shareable URLs and no
 *              branching inside the submit handler.
 *
 * LAST UPDATED: 2026-10-16 - Keep the email on a failed sign in (Josh Iehle)
 *               2026-10-11 - Split from register, new layout (Josh Iehle)
 *               2026-09-26 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { FormState } from '../lib/formState';

// -------------------- Module and lib imports --------------------
import { useActionState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { useAuth } from '../lib/auth/useAuth';
import { supabase } from '../lib/supabase';

// -------------------- Component imports --------------------
import { AuthLayout } from '../layouts/AuthLayout';
import { TextField } from '../components/form/TextField';

// -------------------- Form Values --------------------

/**
 * Only the email is carried across a failed submit.
 *
 * The password is deliberately NOT in here. Re-populating a password field
 * means the value sits in React state and in a DOM attribute for as long as
 * the page is open, and retyping it is no hardship when sign in has just
 * failed.
 */
type LoginValues = { email: string };

// -------------------- Component --------------------
export function LoginPage() {
  // ----- 1. Session state -----
  const { session, loading } = useAuth();
  const location = useLocation();

  // ProtectedRoute stashes where the user was headed before being bounced
  // here, so a deep link survives the detour through login.
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  // ----- 2. Form action state -----
  // Returns a FormState rather than a bare error string. React 19 resets the
  // form after an action runs, so without the returned `values` the email box
  // would clear every time a password was wrong. See lib/formState.ts.
  const [state, submitAction, isPending] = useActionState(
    async (
      _previous: FormState<LoginValues>,
      formData: FormData,
    ): Promise<FormState<LoginValues>> => {
      const email = String(formData.get('email') ?? '').trim();
      const password = String(formData.get('password') ?? '');

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      // On success onAuthStateChange fires, AuthProvider updates, and the
      // <Navigate> below redirects. No manual navigation needed here.
      return { values: { email }, formError: authError?.message };
    },
    { values: { email: '' } },
  );

  // ----- 3. Redirect if already signed in -----
  // Hooks must all run before any early return, which is why this sits below
  // useActionState rather than at the top of the component.
  if (loading) {
    return <div className="grid h-full place-items-center text-ink-900">Loading…</div>;
  }
  if (session) return <Navigate to={from} replace />;

  // ----- 4. Render -----
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="duration-150 font-medium text-brand-600 hover:underline hover:text-brand-700"
          >
            Sign Up
          </Link>
        </>
      }
    >
      <form action={submitAction} className="space-y-4">
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.values.email}
          placeholder="your_email@example.com"
        />

        <div>
          <TextField
            label="Password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />

          <div className="mt-1 text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-ink-700 hover:underline duration-150"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        {state.formError && (
          <p role="alert" className="text-sm text-red-600">
            {state.formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50 cursor-pointer duration-150"
        >
          {isPending ? 'Signing in…' : 'Log In'}
        </button>
      </form>
    </AuthLayout>
  );
}
