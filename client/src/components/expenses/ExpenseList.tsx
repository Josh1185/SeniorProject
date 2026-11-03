/**
 * FILE: ExpenseList.tsx
 * DESCRIPTION: The expense list, built on DataList.
 *
 *              Copies the shape of TripList: a columns array for the desktop
 *              table, a small local card component for mobile, and DataList
 *              wiring the two together. All the responsive plumbing lives in
 *              DataList; what is left here is only what is specific to an
 *              expense.
 *
 *              ONE DIFFERENCE FROM TripList: the title is a <button>, not a
 *              <Link>. A trip navigates to a page; an expense opens a modal.
 *              Never a <div onClick> - a div cannot be focused by keyboard and
 *              is invisible to a screen reader.
 *
 * LAST UPDATED: 2026-11-02 - Rows open the detail modal (Josh Iehle)
 *               2026-11-02 - File Created (Josh Iehle)
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
  /** Called with the whole row, not just its id. See the note in ExpensesPage. */
  onSelect: (expense: ExpenseListItem) => void;
}

// -------------------- Internal Helpers --------------------

/** "3 people" / "1 person". Shown so a shared cost reads differently from a solo one. */
function describeSplit(count: number): string {
  return `${count} ${count === 1 ? 'person' : 'people'}`;
}

// -------------------- Internal Components --------------------

/**
 * One mobile card. The whole card is the button, the way the whole trip card
 * is a link - on a phone a small tap target inside a large card is a miss
 * waiting to happen.
 */
function ExpenseCard({
  expense,
  onSelect,
}: {
  expense: ExpenseListItem;
  onSelect: (expense: ExpenseListItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(expense)}
      className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-lg border border-ink-300 p-4 text-left duration-150 hover:bg-ink-100"
    >
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
    </button>
  );
}

// -------------------- Columns --------------------

/**
 * The desktop table, one entry per column.
 *
 * Built INSIDE the component rather than at module scope, unlike
 * TRIP_COLUMNS. The title cell needs `onSelect`, which is a prop, so the array
 * can no longer be a constant. Rebuilding a five-element array per render
 * costs nothing measurable; a `useMemo` here would be theatre, since the
 * parent passes a new callback each render anyway.
 *
 * SPLIT is not in the lofi wireframe. The endpoint already returns
 * participantCount and "is this mine alone or shared?" is the first thing
 * anyone asks of an expense row. Delete the entry to match the mockup exactly.
 */
function buildExpenseColumns(
  onSelect: (expense: ExpenseListItem) => void,
): Column<ExpenseListItem>[] {
  return [
    {
      header: 'Title',
      cell: (expense) => (
        <button
          type="button"
          onClick={() => onSelect(expense)}
          className="cursor-pointer font-medium text-ink-900 duration-150 hover:text-brand-600"
        >
          {expense.title}
        </button>
      ),
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
}

// -------------------- Component --------------------
export function ExpenseList({ expenses, onSelect }: ExpenseListProps) {
  return (
    <DataList
      items={expenses}
      getKey={(expense) => expense.id}
      columns={buildExpenseColumns(onSelect)}
      renderCard={(expense) => <ExpenseCard expense={expense} onSelect={onSelect} />}
    />
  );
}
