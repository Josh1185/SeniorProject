/**
 * FILE: ExpenseDetailModal.tsx
 * DESCRIPTION: One expense, read-only, in a dialog.
 *
 *              The participant breakdown is the point of this screen. An
 *              expense row tells you $62.00 was spent; this tells you who owes
 *              what for it, which is the question the whole module exists to
 *              answer.
 *
 * LAST UPDATED: 2026-11-02 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ExpenseListItem, ExpenseParticipantSummary } from '../../types/api';

// -------------------- Module and lib imports --------------------
import { useEffect } from 'react';
import { formatCents, formatDate } from '../../lib/format';

// -------------------- Hook imports --------------------
import { useAuth } from '../../lib/auth/useAuth';
import { useExpense } from '../../hooks/expenses/useExpense';

// -------------------- Component imports --------------------
import { DetailField, DetailModal } from '../DetailModal';

// -------------------- Props interface --------------------
interface ExpenseDetailModalProps {
  tripId: string | undefined;
  /** The clicked list row, or null when nothing is open. */
  expense: ExpenseListItem | null;
  onClose: () => void;
}

// -------------------- Internal Components --------------------

/**
 * One line of the split.
 *
 * The viewer's own row is outlined, because "what do I owe for this?" is the
 * first thing anyone looks for and scanning a list of names for your own is
 * exactly the kind of small friction that makes a screen feel unfinished.
 */
function ParticipantRow({
  participant,
  isYou,
}: {
  participant: ExpenseParticipantSummary;
  isYou: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
        isYou ? 'border-brand-600 bg-ink-100' : 'border-ink-300'
      }`}
    >
      <span className="min-w-0 truncate text-sm text-ink-900">
        {participant.user.displayName}
        {isYou && <span className="ml-2 text-xs font-medium text-brand-600">You</span>}
      </span>

      {/* tabular-nums so a stack of shares lines up on the decimal point. */}
      <span className="shrink-0 text-sm font-medium text-ink-900 tabular-nums">
        {formatCents(participant.shareCents)}
      </span>
    </li>
  );
}

// -------------------- Component --------------------
export function ExpenseDetailModal({ tripId, expense, onClose }: ExpenseDetailModalProps) {
  // ----- 1. Hooks, all of them, before any branching -----
  // React calls hooks in order, so an early return above one of these would
  // change the hook count between renders and React would throw.
  const { session } = useAuth();
  const detail = useExpense(tripId, expense?.id);

  const data = detail.data?.expense;

  // ----- 2. Development-only invariant check -----
  //
  // The sum of the participant shares must equal amountCents. The database
  // cannot enforce that - it is held by splitEqually and by the re-split in
  // updateExpense - so this is the first and only place a human would ever
  // notice it had stopped being true.
  //
  // A console error rather than anything on screen: a user can do nothing
  // about it, and the audience for this is whoever is about to build the
  // balances feature on top of these numbers. Stripped from production by
  // Vite, since import.meta.env.DEV is replaced with a literal at build time.
  useEffect(() => {
    if (!import.meta.env.DEV || !data) return;

    const shareTotal = data.participants.reduce(
      (total, participant) => total + participant.shareCents,
      0,
    );

    if (shareTotal !== data.amountCents) {
      console.error(
        `Expense ${data.id}: shares sum to ${shareTotal} but amountCents is ` +
          `${data.amountCents}. Balances built on this expense will not reconcile.`,
      );
    }
  }, [data]);

  // ----- 3. Render -----
  return (
    <DetailModal
      open={Boolean(expense)}
      onClose={onClose}
      // From the ROW, not from the query - so the header is right immediately
      // instead of blank until the request lands.
      title={expense?.title ?? ''}
      isLoading={detail.isLoading}
      error={detail.error as Error | null}
      // E-5 puts Edit and Delete here.
    >
      <DetailField label="Paid by">{data?.paidBy.displayName}</DetailField>

      <DetailField label="Amount">
        <span className="tabular-nums">
          {data ? formatCents(data.amountCents) : null}
        </span>
      </DetailField>

      <DetailField label="Date">{data ? formatDate(data.expenseDate) : null}</DetailField>

      {/* Rendered only when set, rather than always showing an em dash.
          Both are null on every expense until Sprint 4 wires activities and
          reservations in, and two permanently empty rows is noise. When X-1
          lands they appear on their own with no change here. */}
      {data?.activity && <DetailField label="Activity">{data.activity.name}</DetailField>}

      {data?.reservation && (
        <DetailField label="Reservation">{data.reservation.name}</DetailField>
      )}

      <DetailField label="Description" full>
        {data?.description}
      </DetailField>

      {/* The split. A `full` field so it spans both columns, with its own list
          inside the <dd> - a <ul> is legal there and keeps the whole modal one
          description list. */}
      <DetailField
        label={
          data
            ? `Split ${data.participants.length} ${data.participants.length === 1 ? 'way' : 'ways'}`
            : 'Split'
        }
        full
      >
        {data && data.participants.length > 0 ? (
          <ul className="mt-1 space-y-2">
            {data.participants.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                isYou={participant.user.id === session?.user?.id}
              />
            ))}
          </ul>
        ) : null}
      </DetailField>
    </DetailModal>
  );
}
