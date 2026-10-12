/**
 * FILE: RegisterPage.tsx
 * DESCRIPTION: Account creation via Supabase.
 *
 *              IMPORTANT: the full name is passed to Supabase as
 *              `options.data.full_name`, which lands in the JWT as
 *              user_metadata.full_name. Our auth middleware reads exactly that
 *              claim to populate User.displayName on the first authenticated
 *              request. Drop it and every new user shows up as the local part
 *              of their email address.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { useActionState } from 'react';
import { Link, Navigate } from 'react-router';
import { useAuth } from '../lib/auth/useAuth';
import { supabase } from '../lib/supabase';

// -------------------- Component imports --------------------
import { AuthLayout } from '../layouts/AuthLayout';
import { TextField } from '../components/TextField';

// -------------------- Component --------------------
export function RegisterPage() {
  // ----- 1. Session state -----
  const { session, loading } = useAuth();

  // ----- 2. Form action state -----
  const [error, submitAction, isPending] = useActionState(
    async (_previousError: string | null, formData: FormData) => {
      const fullName = String(formData.get('fullName') ?? '').trim();
      const email = String(formData.get('email') ?? '');
      const password = String(formData.get('password') ?? '');
      const confirmPassword = String(formData.get('confirmPassword') ?? '');

      // Checked here rather than by the browser: there is no HTML attribute
      // for "must equal that other field".
      if (password !== confirmPassword) {
        return 'Passwords do not match';
      }

      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Becomes user_metadata on the JWT. See the file header - the server
          // reads full_name to set displayName.
          data: { full_name: fullName },
        },
      });

      return authError ? authError.message : null;
    },
    null,
  );

  // ----- 3. Redirect if already signed in -----
  if (loading) {
    return <div className="grid h-full place-items-center text-slate-500">Loading…</div>;
  }
  if (session) return <Navigate to="/dashboard" replace />;

  // ----- 4. Render -----
  return (
    <AuthLayout
      title="Create an Account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-slate-900 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form action={submitAction} className="space-y-4">
        <TextField
          label="Full Name"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          placeholder="Enter your full name"
        />

        <TextField
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="your_email@example.com"
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />

        <TextField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  );
}
