/**
 * FILE: AppHeader.tsx
 * DESCRIPTION: The constant top bar: logo on the left, notification bell and
 *              profile menu on the right.
 *
 *              Shown on every signed-in page. NOT shown on the landing page
 *              or the auth pages - those sit outside AppLayout entirely.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { Link, useLocation } from 'react-router';

// -------------------- Component imports --------------------
import { ProfileMenu } from './ProfileMenu';

// -------------------- Internal Helpers --------------------

/**
 * The context label beside the logo ("TripSquad | Dashboard").
 *
 * Derived from the path rather than passed down as a prop, because AppLayout
 * sits above both the dashboard and the trip workspace and would otherwise
 * need to know which one is rendering beneath it.
 */
function contextLabel(pathname: string): string {
  if (pathname.startsWith('/trips/')) return 'Trip Workspace';
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  return '';
}

// -------------------- Component --------------------
export function AppHeader() {
  const { pathname } = useLocation();
  const label = contextLabel(pathname);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* ---------- Logo + context ---------- */}
        <Link to="/dashboard" className="flex items-center gap-2 text-lg">
          <span className="font-semibold text-slate-900">TripSquad</span>

          {label && (
            <>
              {/* Decorative divider, hidden from screen readers so it is not
                  announced as a stray pipe character. */}
              <span aria-hidden="true" className="text-slate-300">
                |
              </span>
              <span className="text-slate-500">{label}</span>
            </>
          )}
        </Link>

        {/* ---------- Actions ---------- */}
        <div className="flex items-center gap-3">
          {/* Notifications are not built yet. The button is here so the layout
              is final, but it is disabled rather than wired to a dead handler -
              a control that looks live and does nothing is worse than one that
              is visibly not ready. */}
          <button
            type="button"
            disabled
            title="Notifications are not available yet"
            aria-label="Notifications"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-400 disabled:cursor-not-allowed"
          >
            {/* Inline SVG rather than an icon library: one icon does not
                justify a dependency. Swap for a library if we end up needing
                a dozen. */}
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
          </button>

          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
