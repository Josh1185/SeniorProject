/**
 * FILE: ForgotPasswordPage.tsx
 * DESCRIPTION: Placeholder. Password reset is deferred - Supabase provides
 *              resetPasswordForEmail, but it needs the email templates and
 *              redirect URLs configured.
 *
 *              The route exists so the link on the login page is not dead.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { Link } from 'react-router';

// -------------------- Page Component --------------------

export function ForgotPasswordPage() {
  return (
    <div className="grid min-h-full place-items-center p-8 text-center">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Password reset</h1>
        <p className="mt-2 max-w-sm text-slate-500">
          Not available yet. Ask the team to reset it for you for now.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
