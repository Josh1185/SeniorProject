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
 * LAST UPDATED: 2026-10-16 - Keep name and email on a failed submit (Josh Iehle)
 *               2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { FormState } from '../lib/formState';

// -------------------- Module and lib imports --------------------
import { useActionState } from 'react';
import { Link, Navigate } from 'react-router';
import { useAuth } from '../lib/auth/useAuth';
import { supabase } from '../lib/supabase';

// -------------------- Component imports --------------------
import { AuthLayout } from '../layouts/AuthLayout';
import { TextField } from '../components/form/TextField';

// -------------------- Form Values --------------------

/** Passwords are deliberately not carried across a failed submit. */
type RegisterValues = { fullName: string; email: string };

// -------------------- Component --------------------
export function RegisterPage() {
  // ----- 1. Session state -----
  const { session, loading } = useAuth();

  // ----- 2. Form action state -----
  // Returns a FormState rather than a bare error string, so a mismatched
  // password confirmation no longer wipes the name and email. See
  // lib/formState.ts for why React 19 makes that necessary.
  const [state, submitAction, isPending] = useActionState(
    async (
      _previous: FormState<RegisterValues>,
      formData: FormData,
    ): Promise<FormState<RegisterValues>> => {
      const values = {
        fullName: String(formData.get('fullName') ?? '').trim(),
        email: String(formData.get('email') ?? '').trim(),
      };

      const password = String(formData.get('password') ?? '');
      const confirmPassword = String(formData.get('confirmPassword') ?? '');

      // Checked here rather than by the browser: there is no HTML attribute
      // for "must equal that other field". A field error rather than a form
      // one, so the message lands under the box that has to change.
      if (password !== confirmPassword) {
        return { values, fieldErrors: { confirmPassword: 'Passwords do not match' } };
      }

      const { error: authError } = await supabase.auth.signUp({
        email: values.email,
        password,
        options: {
          // Becomes user_metadata on the JWT. See the file header - the server
          // reads full_name to set displayName.
          data: { full_name: values.fullName },
        },
      });

      return { values, formError: authError?.message };
    },
    { values: { fullName: '', email: '' } },
  );

  // ----- 3. Redirect if already signed in -----
  if (loading) {
    return <div className="grid h-full place-items-center text-ink-900">Loading…</div>;
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
          <Link
            to="/login"
            className="duration-150 font-medium text-brand-600 hover:underline hover:text-brand-700"
          >
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
          defaultValue={state.values.fullName}
          placeholder="Enter your full name"
        />

        <TextField
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.values.email}
          placeholder="your_email@example.com"
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Enter your password"
        />

        <TextField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          error={state.fieldErrors?.confirmPassword}
          placeholder="Confirm your password"
        />

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
          {isPending ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  );
}
