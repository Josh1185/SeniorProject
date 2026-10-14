/**
 * FILE: MyTripsPage.tsx
 * DESCRIPTION: The trip list page: toolbar, list, create modal.
 *
 *              FILTER STATE LIVES IN THE URL, not useState. `?search=orlando`
 *              survives a refresh, works with the back button, and can be
 *              pasted to a teammate. useSearchParams makes that about as cheap
 *              as local state.
 *
 *              The search INPUT is still local state, synced to the URL after
 *              a pause. Writing a URL param per keystroke would spam history
 *              and make typing feel laggy.
 *
 * LAST UPDATED: 2026-10-13 - Real list, filters, create modal (Josh Iehle)
 *               2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTrips } from '../../hooks/trips/useTrips';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

// -------------------- Type imports --------------------
import type { TripFilters } from '../../services/tripService';

// -------------------- Component imports --------------------
import { EmptyState } from '../../components/list/EmptyState';
import { ListToolbar } from '../../components/list/ListToolbar';
import { TripFormModal } from '../../components/TripFormModal';
import { TripList } from '../../components/dashboard/TripList';

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

// -------------------- Component --------------------
export function MyTripsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  // ----- 1. Read filters out of the URL -----
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const role = searchParams.get('role') ?? '';
  const sortParam = searchParams.get('sort') ?? 'startDate:asc';
  const [sort, order] = sortParam.split(':');

  // ----- 2. Keep the search box responsive -----
  // Local state so typing is instant, debounced into the URL so we are not
  // pushing a history entry and refetching on every keypress.
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const [lastSearchParam, setLastSearchParam] = useState(search);

  if (search !== lastSearchParam) {
    setLastSearchParam(search);
    setSearchInput(search);
  }

  useEffect(() => {
    if (debouncedSearch !== searchInput) return;

    // Nothing to do if the URL already agrees - without this guard the effect
    // would write the same value back and loop.
    if (searchInput === search) return;

    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (searchInput) next.set('search', searchInput);
        else next.delete('search');
        return next;
      },
      // Typing should not bury the previous page under a dozen history
      // entries, so each keystroke replaces rather than pushes.
      { replace: true },
    );
  }, [debouncedSearch, searchInput, search, setSearchParams]);

  /** Writes one filter to the URL, clearing it when the value is empty. */
  function setFilter(key: string, value: string) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  }

  // ----- 3. Fetch -----
  // The filters object is the query key, so changing any dropdown refetches
  // automatically and React Query caches each combination separately.
  const filters: TripFilters = {
    search: search || undefined,
    status: (status || undefined) as TripFilters['status'],
    role: (role || undefined) as TripFilters['role'],
    sort: sort as TripFilters['sort'],
    order: order as TripFilters['order'],
  };

  const trips = useTrips(filters);

  const hasFilters = Boolean(search || status || role);
  const results = trips.data?.trips ?? [];

  // ----- 4. Render -----
  return (
    <div>
      <ListToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search trips…"
        selects={[
          {
            name: 'Status',
            value: status,
            options: STATUS_OPTIONS,
            onChange: (value) => setFilter('status', value),
          },
          {
            name: 'Role',
            value: role,
            options: ROLE_OPTIONS,
            onChange: (value) => setFilter('role', value),
          },
          {
            name: 'Sort',
            value: sortParam,
            options: SORT_OPTIONS,
            onChange: (value) => setFilter('sort', value),
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
            title={hasFilters ? 'No trips match those filters' : 'No trips yet'}
            description={
              hasFilters
                ? 'Try clearing the search or changing the filters.'
                : 'Create your first trip to start planning with your group.'
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
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
