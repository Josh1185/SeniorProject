/**
 * FILE: DetailModal.tsx
 * DESCRIPTION: Read-only detail view for one item from a list, in a dialog.
 *
 *              Activities, reservations, itinerary events and expenses all open
 *              one of these from their list. Trips are the exception - the trip
 *              workspace page IS the trip's detail view - which is why this
 *              shell exists at all. There is no Trip version to copy, so this
 *              is the reference.
 *
 *              It owns the chrome only: the dialog, the loading and error
 *              states, the two-column field grid, and a footer for actions.
 *              Each feature supplies its own DetailField rows.
 *
 *              Pairs with components/list/DataList the way a detail view pairs
 *              with a list: DataList renders the rows, this renders the one the
 *              user picked.
 *
 * LAST UPDATED: 2026-10-16 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ReactNode } from 'react';

// -------------------- Component imports --------------------
import { Modal } from './Modal';

// -------------------- Props interface --------------------
interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Pass the name from the LIST ROW, not from the detail query. The row is
   * already in hand when the modal opens, so the header is correct instantly
   * instead of being blank for the length of the request.
   */
  title: string;
  isLoading?: boolean;
  error?: Error | null;
  /** Edit / Delete buttons, added in PR 5. Omit while the view is read-only. */
  actions?: ReactNode;
  /** DetailField rows. */
  children: ReactNode;
}

// -------------------- Component --------------------
export function DetailModal({
  open,
  onClose,
  title,
  isLoading = false,
  error = null,
  actions,
  children,
}: DetailModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {isLoading && <p className="py-6 text-center text-sm text-ink-700">Loading…</p>}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Same field grid as the trip overview, so the two read the same. */}
          <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>

          {actions && (
            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-ink-300 pt-4 sm:flex-row sm:justify-end">
              {actions}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

// -------------------- DetailField --------------------
interface DetailFieldProps {
  label: string;
  /** Spans both columns - for descriptions and notes. */
  full?: boolean;
  children: ReactNode;
}

/**
 * One label/value pair. Renders an em dash when the value is empty, so an
 * optional field that was left blank still occupies its slot in the grid
 * rather than silently collapsing and shuffling everything after it.
 */
export function DetailField({ label, full = false, children }: DetailFieldProps) {
  const isEmpty = children === null || children === undefined || children === '';

  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs text-ink-700">{label}</dt>
      <dd className="text-sm font-medium text-ink-900">
        {isEmpty ? <span className="text-ink-700">—</span> : children}
      </dd>
    </div>
  );
}
