/**
 * FILE: InvitationStatusBadge.tsx
 * DESCRIPTION: An invitation's state, as a pill.
 *
 *              FOUR STATES, and EXPIRED is the one that matters. The server
 *              reconciles a stored PENDING against the clock before it
 *              answers, so a row that says EXPIRED here has already been
 *              judged dead - this component never does that arithmetic
 *              itself. Two places computing the same thing is how a list
 *              starts disagreeing with the buttons on it.
 *
 * LAST UPDATED: 2026-11-16 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { InvitationStatus } from '../../types/api';

// -------------------- Styles --------------------

const STYLES: Record<InvitationStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  DECLINED: 'bg-ink-200 text-ink-700',
  EXPIRED: 'bg-ink-200 text-ink-700',
};

const LABELS: Record<InvitationStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  EXPIRED: 'Expired',
};

// -------------------- Component --------------------
export function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
