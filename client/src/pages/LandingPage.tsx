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

// -------------------- Component imports --------------------
import { TripSquadLogo } from '../components/TripSquadLogo';

// -------------------- Asset imports --------------------
import heroImage from '../assets/hero-image.png';

// -------------------- Component --------------------
export function LandingPage() {
  const { session, loading } = useAuth();

  // Someone already signed in has no use for the pitch. Wait for the session
  // check first, or a refresh would flash this page before redirecting.
  if (loading) {
    return <div className="grid h-full place-items-center text-ink-900">Loading…</div>;
  }
  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="w-full flex min-h-full flex-col bg-ink-50">
      {/* ---------- Header. Separate from AppHeader: this page has no profile menu or notifications, because nobody is signed in. ---------- */}
      <header className="w-full flex h-16 items-center justify-between border-b border-ink-300 px-4 sm:px-6">
        <TripSquadLogo className="text-brand-600" />

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="duration-150 rounded-md px-4 py-2 text-sm text-ink-700 hover:text-ink-900 font-medium"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="duration-150 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <main className="w-full flex flex-1 items-center px-4 py-12 sm:px-6 lg:py-20">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-start">
            <h1 className="text-4xl leading-tight font-bold text-ink-900 sm:text-5xl lg:text-6xl">
              Plan Together.
              <br />
              Travel Better.
            </h1>

            <p className="mt-6 max-w-md text-lg text-ink-700">
              Organize trips, coordinate plans, and manage group travel all in one place.
            </p>

            <Link
              to="/register"
              className="duration-150 mt-8 inline-block rounded-md bg-brand-600 px-8 py-3 font-medium text-white hover:bg-brand-700"
            >
              Get Started
            </Link>
          </div>

          {/* Placeholder for the product screenshot. aspect-video holds the
              space so the layout does not jump when a real image lands. */}
          <img
            src={heroImage}
            alt="The TripSquad trip workspace, showing a shared itinerary and group expenses"
            className="aspect-video w-full rounded-xl object-cover lg:aspect-4/3"
          />
        </div>
      </main>
    </div>
  );
}
