/**
 * FILE: NotFoundPage.tsx
 * DESCRIPTION: Catch-all for unmatched routes.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { Link } from 'react-router';

// -------------------- Page Component --------------------

export function NotFoundPage() {
  return (
    <div className="grid min-h-full place-items-center p-8 text-center bg-ink-50">
      <div>
        <p className="text-5xl font-bold text-brand-600">404</p>
        <h1 className="mt-3 text-xl font-semibold text-ink-900">Page not found</h1>
        <p className="mt-1 text-ink-700">That page does not exist.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
