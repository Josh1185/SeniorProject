/**
 * FILE: App.tsx
 * DESCRIPTION: Root component for the app
 *
 *              THE SHAPE: layout routes with <Outlet /> rather than wrapping
 *              every page in a layout component. Two reasons:
 *
 *              1. The header and sidebar do NOT remount when you navigate
 *                 between pages inside them. Wrapping each page individually
 *                 would tear the header down and rebuild it on every click.
 *              2. Adding a feature page is one line here, not a line plus a
 *                 layout import in the page itself.
 *
 *              Nesting reads top to bottom as the visual nesting on screen:
 *              ProtectedRoute > AppLayout (header) > TripWorkspaceLayout
 *              (sidebar) > the page.
 *
 * LAST UPDATED: 2026-10-11 - Full route tree and layouts (Josh Iehle)
 *               2026-09-26 - Add routing (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { Route, Routes } from 'react-router';

// -------------------- Layout imports --------------------
import { AppLayout } from './layouts/AppLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { TripWorkspaceLayout } from './layouts/TripWorkspaceLayout';

// -------------------- Component imports --------------------
import { ProtectedRoute } from './components/ProtectedRoute';

// -------------------- Public page imports --------------------
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';

// -------------------- Dashboard page imports --------------------
import { InvitationsPage } from './pages/dashboard/InvitationsPage';
import { MyTripsPage } from './pages/dashboard/MyTripsPage';

// -------------------- Trip Workspace page imports --------------------
import { ActivitiesPage } from './pages/trip/ActivitiesPage';
import { ExpensesPage } from './pages/trip/ExpensesPage';
import { ItineraryPage } from './pages/trip/ItineraryPage';
import { MembersPage } from './pages/trip/MembersPage';
import { OverviewPage } from './pages/trip/OverviewPage';
import { ReservationsPage } from './pages/trip/ReservationsPage';

// -------------------- Component --------------------
export function App() {
  return (
    <Routes>
      {/* ----- Public, No header, No sidebar ----- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* ----- Protected ----- */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard, with My Trips / Invitations as real routes rather than
            local tab state. That way the back button works and a teammate can
            paste a link straight to the invitations tab. */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<MyTripsPage />} />
          <Route path="invitations" element={<InvitationsPage />} />
        </Route>

        {/* Trip workspace. The sidebar lives in TripWorkspaceLayout and stays
            mounted while you move between subpages.

            `index` is the Overview page - /trips/abc123 with nothing after it.
            Every other path is relative, so `itinerary` resolves to
            /trips/abc123/itinerary. */}
        <Route path="/trips/:tripId" element={<TripWorkspaceLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="itinerary" element={<ItineraryPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="members" element={<MembersPage />} />
        </Route>

      </Route>

      {/* ----- Catch-all ----- */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
