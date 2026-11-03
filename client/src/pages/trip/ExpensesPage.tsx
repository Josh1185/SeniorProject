/**
 * FILE: ExpensesPage.tsx
 * DESCRIPTION: The trip's expense list: summary, toolbar, list, and every
 *              dialog the feature owns.
 *
 *              Filter state lives in the URL via useListQueryState, so
 *              `?search=gas` survives a refresh, works with the back button,
 *              and can be pasted to a teammate.
 *
 *              DIALOG STATE IS ONE TAGGED UNION, not four booleans. Only one
 *              dialog may be open at a time - two native <dialog> elements
 *              open together is legal HTML and looks broken - and a union
 *              makes that structurally impossible rather than a rule someone
 *              has to remember. Opening one closes whatever was open, because
 *              there is only one variable to assign.
 *
 *              WHAT IS STILL NOT HERE:
 *                - "Your Balance" in the summary -> E-6
 *                - A "Paid by" filter -> needs a server query param; one entry
 *                  in `selects` once it exists
 *
 *              The lofi also shows Prev / Next pagination. The endpoint
 *              returns every expense on the trip, so there is nothing to page
 *              through - "Showing N of N" is honest, and dead Prev/Next
 *              buttons would not be.
 *
 * LAST UPDATED: 2026-11-02 - Remount the form on every open (Josh Iehle)
 *               2026-11-02 - Add, edit and delete (Josh Iehle)
 *               2026-11-02 - Detail modal (Josh Iehle)
 *               2026-11-02 - Real list, search and sort (Josh Iehle)
 *               2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ExpenseDetail, ExpenseListItem } from '../../types/api';
import type { ExpenseFilters } from '../../services/expenseService';

// -------------------- Module and lib imports --------------------
import { useState } from 'react';
import { useParams } from 'react-router';
import { formatCents } from '../../lib/format';
import { unpackSort } from '../../lib/listParams';

// -------------------- Hook imports --------------------
import { useDeleteExpense } from '../../hooks/expenses/useDeleteExpense';
import { useExpenses } from '../../hooks/expenses/useExpenses';
import { useListQueryState } from '../../hooks/useListQueryState';

// -------------------- Component imports --------------------
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/list/EmptyState';
import { ExpenseDetailModal } from '../../components/expenses/ExpenseDetailModal';
import { ExpenseFormModal } from '../../components/expenses/ExpenseFormModal';
import { ExpenseList } from '../../components/expenses/ExpenseList';
import { ListToolbar } from '../../components/list/ListToolbar';

// -------------------- Dialog State --------------------

/**
 * Which dialog is open, and what it is open on.
 *
 * The data each dialog needs lives in its own variant: the detail modal has a
 * list row (enough for its header), while edit and delete carry the full
 * detail, because the form needs the participant list and the row does not
 * have it.
 */
type Dialog =
  | { kind: 'none' }
  | { kind: 'detail'; expense: ExpenseListItem }
  | { kind: 'create' }
  | { kind: 'edit'; expense: ExpenseDetail }
  | { kind: 'delete'; expense: ExpenseDetail };

const CLOSED: Dialog = { kind: 'none' };

// -------------------- List State Defaults --------------------

/**
 * Every param this page owns, and its default.
 *
 * The keys ARE the query-string keys, and a value equal to its default is kept
 * out of the URL entirely - so the common case has a clean URL.
 */
const EXPENSE_LIST_DEFAULTS = {
  search: '',
  sort: 'expenseDate:desc',
};

// -------------------- Filter Options --------------------

/**
 * Every value here must be a sort the SERVER accepts - its enum is
 * title | expenseDate | createdAt.
 */
const SORT_OPTIONS = [
  { value: 'expenseDate:desc', label: 'Sort: Most recent' },
  { value: 'expenseDate:asc', label: 'Sort: Oldest first' },
  { value: 'title:asc', label: 'Sort: Title A-Z' },
  { value: 'title:desc', label: 'Sort: Title Z-A' },
  { value: 'createdAt:desc', label: 'Sort: Recently added' },
];

// -------------------- Internal Components --------------------

/**
 * The money line under the heading.
 *
 * `totalCents` is the TRIP's total, computed server-side and unaffected by the
 * search box. "Your Balance" belongs beside this and arrives with E-6.
 */
function ExpenseSummary({ totalCents }: { totalCents: number }) {
  return (
    <p className="mt-1 text-sm text-ink-700">
      Total Trip Spending:{' '}
      <span className="font-semibold text-ink-900 tabular-nums">{formatCents(totalCents)}</span>
    </p>
  );
}

// -------------------- Component --------------------
export function ExpensesPage() {
  const { tripId } = useParams();

  const [dialog, setDialog] = useState<Dialog>(CLOSED);

  // ----- 1. List state, from the URL -----
  const list = useListQueryState({ defaults: EXPENSE_LIST_DEFAULTS });
  const { sort, order } = unpackSort(list.values.sort, 'expenseDate', 'desc');

  // ----- 2. Fetch -----
  const filters: ExpenseFilters = {
    search: list.values.search || undefined,
    sort: sort as ExpenseFilters['sort'],
    order: order as ExpenseFilters['order'],
  };

  const expenses = useExpenses(tripId, filters);

  const results = expenses.data?.expenses ?? [];
  const totalCents = expenses.data?.totalCents ?? 0;

  // ----- 3. Delete -----
  // Hooks run before any branching, so this is created whether or not a delete
  // dialog is open. With an empty id it simply never fires.
  const expenseToDelete = dialog.kind === 'delete' ? dialog.expense : null;
  const deleteExpense = useDeleteExpense(tripId ?? '', expenseToDelete?.id ?? '');

  // ----- 4. Form identity -----
  // Changes on every open, so the form modal remounts and re-reads `expense`.
  // See the note beside <ExpenseFormModal> below.
  const formKey =
    dialog.kind === 'edit' ? `edit:${dialog.expense.id}` : `${dialog.kind}:new`;

  // ----- 5. Render -----
  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Trip Expenses</h1>
        <ExpenseSummary totalCents={totalCents} />
      </div>

      <div className="mt-4">
        <ListToolbar
          searchValue={list.searchInput}
          onSearchChange={list.setSearchInput}
          searchPlaceholder="Search expenses…"
          selects={[
            {
              name: 'Sort',
              value: list.values.sort,
              options: SORT_OPTIONS,
              onChange: (value) => list.setValue('sort', value),
            },
          ]}
          action={
            <button
              type="button"
              onClick={() => setDialog({ kind: 'create' })}
              className="w-full cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-brand-700 sm:w-auto"
            >
              Add Expense
            </button>
          }
        />
      </div>

      <div className="mt-6">
        {/* isLoading is the FIRST load only. isFetching would also be true on
            a background refetch, which would flash the skeleton every time a
            filter changed. */}
        {expenses.isLoading && <p className="py-12 text-center text-ink-700">Loading expenses…</p>}

        {expenses.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">{(expenses.error as Error).message}</p>
            <button
              type="button"
              onClick={() => void expenses.refetch()}
              className="mt-2 cursor-pointer text-sm text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {!expenses.isLoading && !expenses.error && results.length === 0 && (
          // Two different empty states. Telling someone with 30 expenses that
          // they have none is confusing.
          <EmptyState
            title={list.isFiltered ? 'No expenses match those filters' : 'No expenses yet'}
            description={
              list.isFiltered
                ? 'Try clearing the search or changing the sort.'
                : 'Record what the group spends and TripSquad works out who owes who.'
            }
            action={
              list.isFiltered ? (
                <button
                  type="button"
                  onClick={list.reset}
                  className="cursor-pointer rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 duration-150 hover:bg-ink-100"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDialog({ kind: 'create' })}
                  className="cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-brand-700"
                >
                  Add Expense
                </button>
              )
            }
          />
        )}

        {results.length > 0 && (
          <>
            <ExpenseList
              expenses={results}
              onSelect={(expense) => setDialog({ kind: 'detail', expense })}
            />
            <p className="mt-4 text-sm text-ink-700">
              Showing {results.length} {results.length === 1 ? 'expense' : 'expenses'}
            </p>
          </>
        )}
      </div>

      {/* ---------- Dialogs ----------
          All three stay mounted and hide themselves. Each `open` reads the
          union, so opening one necessarily closes the others. */}

      <ExpenseDetailModal
        tripId={tripId}
        expense={dialog.kind === 'detail' ? dialog.expense : null}
        onClose={() => setDialog(CLOSED)}
        // One assignment replaces the open dialog rather than adding to it.
        // This is the whole reason the state is a union.
        onEdit={(expense) => setDialog({ kind: 'edit', expense })}
        onDelete={(expense) => setDialog({ kind: 'delete', expense })}
      />

      {/* `key` is doing real work here, not just silencing a warning.
          ExpenseFormModal reads `expense` in useState initialisers and in
          useActionState's initial state, and BOTH of those run only on mount.
          The modal stays mounted the whole time it is hidden, so without a
          changing key the edit form would open showing the blanks it was
          mounted with. Keying on the dialog itself means every open is a
          fresh mount: correct prefill on edit, a clean sheet on create. */}
      <ExpenseFormModal
        key={formKey}
        open={dialog.kind === 'create' || dialog.kind === 'edit'}
        onClose={() => setDialog(CLOSED)}
        tripId={tripId}
        expense={dialog.kind === 'edit' ? dialog.expense : undefined}
      />

      <ConfirmDialog
        open={dialog.kind === 'delete'}
        onClose={() => setDialog(CLOSED)}
        title="Delete this expense?"
        // Naming the consequence, not asking "are you sure?". The second
        // sentence is the one that matters: deleting an expense moves what
        // everyone owes, and that is not obvious from a delete button.
        description={
          expenseToDelete
            ? `"${expenseToDelete.title}" (${formatCents(expenseToDelete.amountCents)}) will be ` +
              `permanently deleted, along with all ${expenseToDelete.participants.length} ` +
              `of its shares. Everyone's balance for this trip will change. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete Expense"
        destructive
        pending={deleteExpense.isPending}
        onConfirm={async () => {
          await deleteExpense.mutateAsync();
          // Closing on success, not before. useDeleteExpense calls
          // removeQueries on the detail key, so leaving a dialog open on a
          // deleted expense would refetch it and show a 404.
          setDialog(CLOSED);
        }}
      />
    </div>
  );
}
