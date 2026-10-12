/**
 * FILE: TripWorkspaceLayout.tsx
 * DESCRIPTION: The trip workspace shell: sidebar on the left, subpage on the
 *              right. Mounted under AppLayout, so the header is already above it.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { Outlet } from 'react-router';

// -------------------- Component imports --------------------
import { TripSidebar } from '../components/TripSidebar';

// -------------------- Component --------------------
export function TripWorkspaceLayout() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:flex-row">
      {/* The sidebar handles its own responsive behaviour: a vertical rail on
          desktop, a horizontal scrolling tab row on mobile. */}
      <TripSidebar />

      {/* min-w-0 is load-bearing. A flex child defaults to min-width:auto,
          which refuses to shrink below its content - so one wide table inside
          a page would push the whole layout sideways and break the sidebar.
          This is the single most common flexbox overflow bug. */}
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
