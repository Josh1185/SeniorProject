/**
 * FILE: LandingPage.tsx
 * DESCRIPTION: Public marketing page. The only route a signed-out visitor
 *              lands on by default.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { Link, Navigate } from 'react-router';
import { useAuth } from '../lib/auth/useAuth';

// -------------------- Component --------------------
export function LandingPage() {
  const { session, loading } = useAuth();

  // Someone already signed in has no use for the pitch. Wait for the session
  // check first, or a refresh would flash this page before redirecting.
  if (loading) {
    return <div className="grid h-full place-items-center text-slate-500">Loading…</div>;
  }
  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* ---------- Header. Separate from AppHeader: this page has no profile menu or notifications, because nobody is signed in. ---------- */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 px-4 sm:px-6">
        <span className="text-lg font-semibold text-slate-900">TripSquad</span>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-md px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <main className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:py-20">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 className="text-4xl leading-tight font-bold text-slate-900 sm:text-5xl lg:text-6xl">
              Plan Together.
              <br />
              Travel Better.
            </h1>

            <p className="mt-6 max-w-md text-lg text-slate-600">
              Organize trips, coordinate plans, and manage group travel all in one place.
            </p>

            <Link
              to="/register"
              className="mt-8 inline-block rounded-md bg-slate-900 px-8 py-3 font-medium text-white hover:bg-slate-700"
            >
              Get Started
            </Link>
          </div>

          {/* Placeholder for the product screenshot. aspect-video holds the
              space so the layout does not jump when a real image lands. */}
          <div
            aria-hidden="true"
            className="aspect-video w-full rounded-xl bg-slate-200 lg:aspect-4/3"
          />
        </div>
      </main>
    </div>
  );
}
