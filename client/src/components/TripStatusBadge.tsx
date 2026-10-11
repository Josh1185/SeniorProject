/**
 * FILE: TripStatusBadge.tsx
 * DESCRIPTION: The Upcoming / Active / Completed pill.
 *
 *              One component so the colours are defined once. Used on the
 *              trip list and the trip overview, and anywhere else a status
 *              needs rendering.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { TripStatus } from '../types/api';

// -------------------- Styles --------------------
// Record<TripStatus, string> means adding a status to the union without adding
// it here is a compile error, not a silently unstyled badge.
const STYLES: Record<TripStatus, string> = {
  UPCOMING: 'bg-brand-50 text-brand-700 ring-brand-100',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  COMPLETED: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const LABELS: Record<TripStatus, string> = {
  UPCOMING: 'Upcoming',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
};

// -------------------- Component --------------------
export function StatusBadge({ status }: { status: TripStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ring-1 ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
