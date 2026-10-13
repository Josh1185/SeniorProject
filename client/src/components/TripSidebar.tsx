/**
 * FILE: TripSidebar.tsx
 * DESCRIPTION: Navigation between the trip workspace subpages, plus a link
 *              back to the dashboard.
 *
 *              Desktop: a vertical rail down the left side.
 *              Mobile:  a horizontal scrolling tab row above the content.
 *
 *              The mobile treatment is a deviation from the wireframe, which
 *              shows no visible navigation on small screens. A rail would eat
 *              the whole width, and a hamburger drawer is more machinery than
 *              seven links justify.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { NavLink, useParams } from 'react-router';

// -------------------- Navigation Definition --------------------

/**
 * One source of truth for the sidebar. Adding a feature page means adding a
 * line here and a line in App.tsx, not editing markup.
 *
 * `to` is RELATIVE, so it resolves against /trips/:tripId automatically. An
 * empty string is the index route (Overview).
 */
const TRIP_NAV = [
  { to: '', label: 'Overview', end: true },
  { to: 'itinerary', label: 'Itinerary' },
  { to: 'activities', label: 'Activities' },
  { to: 'reservations', label: 'Reservations' },
  { to: 'expenses', label: 'Expenses' },
  { to: 'members', label: 'Members' },
] as const;

// -------------------- Internal Helpers --------------------

/**
 * NavLink hands its className a render function with `isActive`, which is how
 * the current page gets highlighted without any manual pathname comparison.
 */
function linkClasses({ isActive }: { isActive: boolean }): string {
  const base = 'block whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors duration-150';
  return isActive
    ? `${base} bg-ink-100 font-medium text-brand-600`
    : `${base} text-ink-700 hover:bg-ink-100 hover:text-ink-900`;
}

// -------------------- Component --------------------
export function TripSidebar() {
  // Only needed for the "Back to Dashboard" link, but reading it here keeps
  // the component honest about where it is allowed to be mounted.
  const { tripId } = useParams();

  return (
    <nav
      aria-label="Trip sections"
      className="flex shrink-0 flex-col lg:w-52 lg:rounded-lg lg:border lg:border-ink-300 lg:bg-ink-150 lg:p-3"
    >
      {/* overflow-x-auto on mobile lets the seven tabs scroll sideways rather
          than wrapping into a tall block that pushes the content down. */}
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {TRIP_NAV.map((item) => (
          <li key={item.to || 'overview'}>
            <NavLink
              to={item.to}
              // `end` on Overview only. Without it the index link stays
              // highlighted on every subpage, because /trips/abc123 is a
              // prefix of /trips/abc123/expenses.
              end={'end' in item ? item.end : false}
              className={linkClasses}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Desktop only. On mobile the header logo already goes back to the
          dashboard, so a second control would be redundant in scarce space. */}
      <div className="mt-auto hidden pt-4 lg:block">
        <NavLink
          to="/dashboard"
          className="block rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-ink-100 hover:text-ink-900 duration-150"
        >
          &lt; Back to Dashboard
        </NavLink>
      </div>

      {/* Dev guard: if this ever renders outside /trips/:tripId the relative
          links silently resolve to the wrong place, which is maddening to
          debug. Fail loudly in development instead. */}
      {!tripId && import.meta.env.DEV && (
        <p className="mt-2 text-xs text-red-600">TripSidebar rendered without a :tripId param.</p>
      )}
    </nav>
  );
}
