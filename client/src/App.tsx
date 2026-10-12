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

// -------------------- Component imports --------------------
import { ProtectedRoute } from './components/ProtectedRoute';

// -------------------- Public page imports --------------------
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';

// -------------------- Dashboard page imports --------------------
import { DashboardPage } from './pages/DashboardPage';

// -------------------- Trip Workspace page imports --------------------

// -------------------- Component --------------------
export function App() {
  return (
    <Routes>
      {/* ----- Public, No header, No sidebar ----- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* ----- Catch-all ----- */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
