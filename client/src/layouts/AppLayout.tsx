/**
 * FILE: AppLayout.tsx
 * DESCRIPTION: The persistent chrome for every signed-in page.
 *
 *              Renders the header once and drops the current page into
 *              <Outlet />. Because this is a LAYOUT ROUTE, React Router keeps
 *              it mounted while the page underneath changes - the header does
 *              not flicker or rebuild on navigation.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { Outlet } from 'react-router';

// -------------------- Component imports --------------------
import { AppHeader } from '../components/AppHeader';

// -------------------- Component --------------------
export function AppLayout() {
  return (
    // min-h-full rather than h-full so a long page can grow past the viewport
    // instead of clipping.
    <div className="flex min-h-full flex-col bg-ink-50">
      <AppHeader />

      {/* flex-1 makes the content area absorb the leftover height, so short
          pages still push the background all the way down. */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
