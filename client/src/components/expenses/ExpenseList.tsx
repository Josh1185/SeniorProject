/**
 * FILE: ExpenseList.tsx
 * DESCRIPTION: The expense list, built on DataList.
 *
 *              Copies the shape of TripList: a module-level `columns` array
 *              for the desktop table, a small local card component for
 *              mobile, and DataList wiring the two together. All the
 *              responsive plumbing lives in DataList; what is left here is
 *              only what is specific to an expense.
 *
 *              ONE DIFFERENCE FROM TripList: the title is not a link. A trip
 *              navigates to a page; an expense opens a modal, and that modal
 *              is E-4. Until then the title is plain text, exactly as
 *              conventions.md PR 3 describes. In E-4 it becomes a <button>.
 *
 * LAST UPDATED: 2026-11-02 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ExpenseListItem } from '../../types/api';
import type { Column } from '../list/listTypes';

// -------------------- Module and lib imports --------------------
import { formatCents, formatDate } from '../../lib/format';

// -------------------- Component imports --------------------
import { DataList } from '../list/DataList';

// -------------------- Props interface --------------------
interface ExpenseListProps {
  expenses: ExpenseListItem[];
}

// -------------------- Internal Helpers --------------------

/** "3 people" / "1 person". Shown so a shared cost reads differently from a solo one. */
function describeSplit(count: number): string {
  return `${count} ${count === 1 ? 'person' : 'people'}`;
}

// -------------------- Internal Components --------------------

/**
 * One mobile card.
 *
 * Not a <Link> and not a <button> yet - nothing to open until E-4. A card
 * that looks clickable and is not is worse than one that plainly is not.
 */
function ExpenseCard({ expense }: { expense: ExpenseListItem }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-ink-300 p-4">
      <div className="min-w-0">
        {/* truncate needs min-w-0 on the flex parent, or a long title pushes
            the amount off the card instead of ellipsing. */}
        <p className="truncate font-medium text-ink-900">{expense.title}</p>
        <p className="mt-1 text-sm text-ink-700">{expense.paidBy.displayName}</p>
        <p className="mt-1 text-sm text-ink-700">{formatDate(expense.expenseDate)}</p>
      </div>

      <div className="shrink-0 text-right">
        {/* tabular-nums makes digits a fixed width, so a stack of amounts
            lines up on the decimal point instead of drifting. */}
        <p className="font-medium text-ink-900 tabular-nums">{formatCents(expense.amountCents)}</p>
        <p className="mt-1 text-xs text-ink-700">{describeSplit(expense.participantCount)}</p>
      </div>
    </div>
  );
}

// -------------------- Columns --------------------

/**
 * The desktop table, one entry per column.
 *
 * At module scope rather than inside the component because nothing here
 * depends on props - so it is built once rather than on every render.
 *
 * SPLIT is not in the lofi wireframe. It is here because the endpoint already
 * returns participantCount and "is this mine alone or shared?" is the first
 * thing anyone asks of an expense row. Delete the entry if you would rather
 * match the mockup exactly; nothing else depends on it.
 */
const EXPENSE_COLUMNS: Column<ExpenseListItem>[] = [
  {
    header: 'Title',
    // Plain text until E-4 gives it a modal to open.
    cell: (expense) => <span className="font-medium text-ink-900">{expense.title}</span>,
  },
  {
    header: 'Paid By',
    cell: (expense) => expense.paidBy.displayName,
    className: 'text-sm text-ink-700',
  },
  {
    header: 'Date',
    cell: (expense) => formatDate(expense.expenseDate),
    className: 'text-sm text-ink-700',
  },
  {
    header: 'Amount',
    cell: (expense) => formatCents(expense.amountCents),
    className: 'text-sm font-medium text-ink-900 tabular-nums',
  },
  {
    header: 'Split',
    cell: (expense) => describeSplit(expense.participantCount),
    className: 'text-sm text-ink-700',
  },
];

// -------------------- Component --------------------
export function ExpenseList({ expenses }: ExpenseListProps) {
  return (
    <DataList
      items={expenses}
      getKey={(expense) => expense.id}
      columns={EXPENSE_COLUMNS}
      renderCard={(expense) => <ExpenseCard expense={expense} />}
    />
  );
}
