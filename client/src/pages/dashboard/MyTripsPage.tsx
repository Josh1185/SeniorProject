/**
 * FILE: MyTripsPage.tsx
 * DESCRIPTION: The trip list page: toolbar, list, create modal.
 *
 *              FILTER STATE LIVES IN THE URL, not useState. `?search=orlando`
 *              survives a refresh, works with the back button, and can be
 *              pasted to a teammate.
 *
 *              All of that plumbing - reading and writing params, the debounced
 *              search box, dropping a param when it is back to its default -
 *              now lives in useListQueryState. This page declares its params
 *              and their defaults and nothing else.
 *
 * LAST UPDATED: 2026-10-16 - Extract useListQueryState (Josh Iehle)
 *               2026-10-13 - Real list, filters, create modal (Josh Iehle)
 *               2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { TripFilters } from '../../services/tripService';

// -------------------- Module and lib imports --------------------
import { useState } from 'react';
import { useNavigate } from 'react-router';

// -------------------- Hook imports --------------------
import { useListQueryState } from '../../hooks/useListQueryState';
import { useTrips } from '../../hooks/trips/useTrips';

// -------------------- Component imports --------------------
import { EmptyState } from '../../components/list/EmptyState';
import { ListToolbar } from '../../components/list/ListToolbar';
import { TripFormModal } from '../../components/TripFormModal';
import { TripList } from '../../components/dashboard/TripList';

// -------------------- List State Defaults --------------------

/**
 * Every param this page owns, and its default.
 *
 * This object is the single source of truth for the list's URL contract: the
 * keys ARE the query-string keys, and a value equal to its default is kept out
 * of the URL entirely.
 *
 * At module scope, not inline in the hook call - useListQueryState freezes the
 * first object it is given, and a module-level constant makes that obvious
 * rather than surprising.
 */
const TRIP_LIST_DEFAULTS = {
  search: '',
  status: '',
  role: '',
  sort: 'startDate:asc',
};

// -------------------- Filter Options --------------------

const STATUS_OPTIONS = [
  { value: '', label: 'Status: All' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'Role: All' },
  { value: 'OWNER', label: 'Owner' },
  { value: 'MEMBER', label: 'Member' },
];

/**
 * Sort and direction are one dropdown in the UI but two query params on the
 * server, so the option value packs both and is split on use.
 */
const SORT_OPTIONS = [
  { value: 'startDate:asc', label: 'Sort: Soonest first' },
  { value: 'startDate:desc', label: 'Sort: Latest first' },
  { value: 'createdAt:desc', label: 'Sort: Recently added' },
  { value: 'name:asc', label: 'Sort: Name A-Z' },
  { value: 'name:desc', label: 'Sort: Name Z-A' },
];

// -------------------- Internal Helpers --------------------

/**
 * Unpacks "startDate:asc" into the two params the API takes.
 *
 * The fallbacks are not defensive padding: `split` is an indexed read, so under
 * noUncheckedIndexedAccess both halves are possibly undefined, and a
 * hand-edited URL really can contain `?sort=nonsense`. Falling back to the
 * default beats sending `undefined` and getting a 422.
 */
function unpackSort(packed: string) {
  const [sort = 'startDate', order = 'asc'] = packed.split(':');
  return { sort, order };
}

// -------------------- Component --------------------
export function MyTripsPage() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  // ----- 1. List state, from the URL -----
  const list = useListQueryState({ defaults: TRIP_LIST_DEFAULTS });
  const { sort, order } = unpackSort(list.values.sort);

  // ----- 2. Fetch -----
  // The filters object is the query key, so changing any dropdown refetches
  // automatically and React Query caches each combination separately.
  //
  // `list.values.search` is the URL-committed value, not what is in the box -
  // which is exactly what should drive the query. The box's own value is
  // list.searchInput and it changes on every keystroke.
  const filters: TripFilters = {
    search: list.values.search || undefined,
    status: (list.values.status || undefined) as TripFilters['status'],
    role: (list.values.role || undefined) as TripFilters['role'],
    sort: sort as TripFilters['sort'],
    order: order as TripFilters['order'],
  };

  const trips = useTrips(filters);
  const results = trips.data?.trips ?? [];

  // ----- 3. Render -----
  return (
    <div>
      <ListToolbar
        searchValue={list.searchInput}
        onSearchChange={list.setSearchInput}
        searchPlaceholder="Search trips…"
        selects={[
          {
            name: 'Status',
            value: list.values.status,
            options: STATUS_OPTIONS,
            onChange: (value) => list.setValue('status', value),
          },
          {
            name: 'Role',
            value: list.values.role,
            options: ROLE_OPTIONS,
            onChange: (value) => list.setValue('role', value),
          },
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
            onClick={() => setCreateOpen(true)}
            className="w-full cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-brand-700 sm:w-auto"
          >
            Create Trip
          </button>
        }
      />

      <div className="mt-6">
        {/* isLoading is the FIRST load only. isFetching would also be true on
            a background refetch, which would flash the skeleton every time a
            filter changed - jarring, and it hides the results you already had. */}
        {trips.isLoading && <p className="py-12 text-center text-ink-700">Loading trips…</p>}

        {trips.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">{(trips.error as Error).message}</p>
            <button
              type="button"
              onClick={() => void trips.refetch()}
              className="mt-2 cursor-pointer text-sm text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {!trips.isLoading && !trips.error && results.length === 0 && (
          // Two different empty states. "No trips yet" and "no matches for
          // your filter" need different words and a different call to action -
          // telling someone with 30 trips that they have no trips is confusing.
          <EmptyState
            title={list.isFiltered ? 'No trips match those filters' : 'No trips yet'}
            description={
              list.isFiltered
                ? 'Try clearing the search or changing the filters.'
                : 'Create your first trip to start planning with your group.'
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
              ) : (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-brand-700"
                >
                  Create Trip
                </button>
              )
            }
          />
        )}

        {results.length > 0 && (
          <>
            <TripList trips={results} />
            <p className="mt-4 text-sm text-ink-700">
              Showing {results.length} {results.length === 1 ? 'trip' : 'trips'}
            </p>
          </>
        )}
      </div>

      <TripFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        // Drop straight into the new trip's workspace. Creating a trip and
        // then having to find it in a list is a small but real annoyance.
        onCreated={(tripId: string) => navigate(`/trips/${tripId}`)}
      />
    </div>
  );
}
