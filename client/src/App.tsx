/**
 * FILE: App.tsx
 * DESCRIPTION: Root component for the app
 *
 * LAST UPDATED: 2026-09-26 - Add routing (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { Navigate, Route, Routes } from 'react-router';

// -------------------- Component imports --------------------
import { ProtectedRoute } from './components/ProtectedRoute';

// -------------------- Page imports --------------------
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

// -------------------- Component --------------------
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<p className="p-8">Page not found.</p>} />
    </Routes>
  );
}
