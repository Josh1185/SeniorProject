/**
 * FILE: ExpensesPage.tsx
 * DESCRIPTION: The trip's expense list: summary, toolbar, list.
 *
 *              Copies MyTripsPage. Filter state lives in the URL via
 *              useListQueryState, so `?search=gas` survives a refresh, works
 *              with the back button, and can be pasted to a teammate.
 *
 *              WHAT IS DELIBERATELY NOT HERE YET, and where it arrives:
 *                - "Your Balance" in the summary          -> E-6
 *                - Add Expense button and create modal    -> E-5
 *                - Clicking a row to open its detail      -> E-4
 *                - Edit / delete actions on a row         -> E-5
 *                - A "Paid by" filter                     -> needs a server
 *                  query param; one entry in `selects` once it exists
 *
 *              The lofi also shows Prev / Next pagination. The endpoint
 *              returns every expense on the trip, so there is nothing to page
 *              through - "Showing N of N" is honest, and dead Prev/Next
 *              buttons would not be. If paging is ever needed it belongs in
 *              the server once, for all four feature lists, not invented here.
 *
 * LAST UPDATED: 2026-11-02 - Real list, search and sort (Josh Iehle)
 *               2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ExpenseFilters } from '../../services/expenseService';

// -------------------- Module and lib imports --------------------
import { useParams } from 'react-router';
import { formatCents } from '../../lib/format';
import { unpackSort } from '../../lib/listParams';

// -------------------- Hook imports --------------------
import { useExpenses } from '../../hooks/expenses/useExpenses';
import { useListQueryState } from '../../hooks/useListQueryState';

// -------------------- Component imports --------------------
import { EmptyState } from '../../components/list/EmptyState';
import { ExpenseList } from '../../components/expenses/ExpenseList';
import { ListToolbar } from '../../components/list/ListToolbar';

// -------------------- List State Defaults --------------------

/**
 * Every param this page owns, and its default.
 *
 * The keys ARE the query-string keys, and a value equal to its default is kept
 * out of the URL entirely - so the common case has a clean URL.
 *
 * At module scope, not inline in the hook call: useListQueryState freezes the
 * first object it is given, and a module-level constant makes that obvious
 * rather than surprising.
 */
const EXPENSE_LIST_DEFAULTS = {
  search: '',
  sort: 'expenseDate:desc',
};

// -------------------- Filter Options --------------------

/**
 * Sort and direction are one dropdown in the UI but two query params on the
 * server, so the option value packs both and is split on use.
 *
 * Every value here must be a sort the SERVER accepts - its enum is
 * title | expenseDate | createdAt. Offering "Highest amount" would need
 * `amountCents` added to listExpensesQuerySchema and to buildExpenseOrderBy;
 * the exhaustiveness check in that switch will refuse to compile until both
 * are done, which is exactly what it is there for.
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
 * search box. Summing the rows on screen would be a different and wrong
 * number: filtering to "gas" would make the trip look thousands cheaper.
 *
 * "Your Balance" belongs beside this and arrives with E-6. It is left out
 * rather than stubbed, because a placeholder number on a money screen is worse
 * than a missing one.
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

  // ----- 1. List state, from the URL -----
  const list = useListQueryState({ defaults: EXPENSE_LIST_DEFAULTS });
  const { sort, order } = unpackSort(list.values.sort, 'expenseDate', 'desc');

  // ----- 2. Fetch -----
  // The filters object is part of the query key, so changing any control
  // refetches automatically and React Query caches each combination.
  //
  // `list.values.search` is the URL-committed value, not what is in the box -
  // which is exactly what should drive the query. The box's own value is
  // list.searchInput and it changes on every keystroke.
  const filters: ExpenseFilters = {
    search: list.values.search || undefined,
    sort: sort as ExpenseFilters['sort'],
    order: order as ExpenseFilters['order'],
  };

  const expenses = useExpenses(tripId, filters);

  const results = expenses.data?.expenses ?? [];
  const totalCents = expenses.data?.totalCents ?? 0;

  // ----- 3. Render -----
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
          // E-5 puts the Add Expense button here.
        />
      </div>

      <div className="mt-6">
        {/* isLoading is the FIRST load only. isFetching would also be true on
            a background refetch, which would flash the skeleton every time a
            filter changed - jarring, and it hides the results you already had. */}
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
          // Two different empty states. "No expenses yet" and "nothing matches
          // your filter" need different words and a different call to action -
          // telling someone with 30 expenses that they have none is confusing.
          <EmptyState
            title={list.isFiltered ? 'No expenses match those filters' : 'No expenses yet'}
            description={
              list.isFiltered
                ? 'Try clearing the search or changing the sort.'
                : 'Expenses recorded for this trip will show up here.'
            }
            action={
              list.isFiltered ? (
                <button
                  type="button"
                  // list.reset() rather than setSearchParams({}) - it clears
                  // only this list's params, so an unrelated one on the URL
                  // survives.
                  onClick={list.reset}
                  className="cursor-pointer rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 duration-150 hover:bg-ink-100"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        )}

        {results.length > 0 && (
          <>
            <ExpenseList expenses={results} />
            <p className="mt-4 text-sm text-ink-700">
              Showing {results.length} {results.length === 1 ? 'expense' : 'expenses'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
