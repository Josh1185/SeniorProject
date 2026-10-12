/**
 * FILE: DashboardLayout.tsx
 * DESCRIPTION: The dashboard shell: My Trips / Invitations tabs plus the
 *              toolbar row, with the active tab's page below.
 *
 *              The tabs are real ROUTES, not local state. That means the back
 *              button works, a link to the invitations tab is shareable, and a
 *              refresh keeps you where you were.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { NavLink, Outlet } from 'react-router';

// -------------------- Internal Helpers --------------------
function tabClasses({ isActive }: { isActive: boolean }): string {
  const base = 'flex-1 border-b-2 px-4 py-3 text-center text-sm transition-colors';
  return isActive
    ? `${base} border-slate-900 font-medium text-slate-900`
    : `${base} border-transparent text-slate-500 hover:text-slate-900`;
}

// -------------------- Component --------------------
export function DashboardLayout() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      {/* ---------- Tabs ---------- */}
      <nav aria-label="Dashboard sections" className="flex border-b border-slate-200">
        {/* `end` so My Trips is not highlighted while /dashboard/invitations
            is open - /dashboard is a prefix of it. */}
        <NavLink to="/dashboard" end className={tabClasses}>
          My Trips
        </NavLink>
        <NavLink to="/dashboard/invitations" className={tabClasses}>
          Invitations
        </NavLink>
      </nav>

      {/* Each tab owns its own toolbar, because the controls differ: My Trips
          needs search, filter, sort and Create Trip; Invitations needs none
          of them. */}
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
