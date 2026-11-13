/**
 * FILE: ActivitiesPage.tsx
 * DESCRIPTION: Displays a trip's activities with search, sorting,
 *              loading/error handling, and empty states.
 *
 * LAST UPDATED: 2026-11-06 - Connect Activities detail modal (Brandon Douglass)
 *               2026-11-03 - Build Activities list page (Brandon Douglass)
 *               2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ActivityListItem } from '../../types/api';
import type { ActivityFilters } from '../../services/activityService';

// -------------------- Module and lib imports --------------------
import { useState } from 'react';
import { useParams } from 'react-router';
import { unpackSort } from '../../lib/listParams';

// -------------------- Hook imports --------------------
import { useActivities } from '../../hooks/activities/useActivities';
import { useListQueryState } from '../../hooks/useListQueryState';

// -------------------- Component imports --------------------
import { ActivityDetailModal } from '../../components/activities/ActivityDetailModal';
import { ActivityList } from '../../components/activities/ActivityList';
import { EmptyState } from '../../components/list/EmptyState';
import { ListToolbar } from '../../components/list/ListToolbar';

// -------------------- List Defaults --------------------

/**
 * Search and sorting live in the URL.
 * The default shows the newest activities first.
 */
const ACTIVITY_LIST_DEFAULTS = {
  search: '',
  sort: 'createdAt:desc',
};

// -------------------- Sort Options --------------------

/** These options match the server's supported sort fields. */
const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Sort: Recently added' },
  { value: 'createdAt:asc', label: 'Sort: Oldest first' },
  { value: 'name:asc', label: 'Sort: Name A-Z' },
  { value: 'name:desc', label: 'Sort: Name Z-A' },
  { value: 'votes:desc', label: 'Sort: Most votes' },
  { value: 'votes:asc', label: 'Sort: Fewest votes' },
];

// -------------------- Component --------------------

export function ActivitiesPage() {
  // ----- 1. Identify the current trip -----
  const { tripId } = useParams();

  // Tracks the activity selected from the list.
  // null means no detail modal is open.
  const [selectedActivity, setSelectedActivity] = useState<ActivityListItem | null>(null);

  // ----- 2. Read search and sort values from the URL -----
  const list = useListQueryState({
    defaults: ACTIVITY_LIST_DEFAULTS,
  });

  const { sort, order } = unpackSort(list.values.sort, 'createdAt', 'desc');

  // ----- 3. Build the API filters -----
  const filters: ActivityFilters = {
    search: list.values.search || undefined,
    sort: sort as ActivityFilters['sort'],
    order: order as ActivityFilters['order'],
  };

  // ----- 4. Fetch activities -----
  const activities = useActivities(tripId, filters);

  const results = activities.data?.activities ?? [];

  // ----- 5. Render the page -----
  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Trip Activities</h1>
        <p className="mt-1 text-sm text-ink-700">Explore activities suggested for this trip.</p>
      </div>

      {/* Search and sorting controls */}
      <div className="mt-4">
        <ListToolbar
          searchValue={list.searchInput}
          onSearchChange={list.setSearchInput}
          searchPlaceholder="Search activities…"
          selects={[
            {
              name: 'Sort',
              value: list.values.sort,
              options: SORT_OPTIONS,
              onChange: (value) => list.setValue('sort', value),
            },
          ]}
        />
      </div>

      <div className="mt-6">
        {/* Loading state */}
        {activities.isLoading && (
          <p className="py-12 text-center text-ink-700">Loading activities…</p>
        )}

        {/* Error state with retry */}
        {activities.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">{(activities.error as Error).message}</p>
            <button
              type="button"
              onClick={() => void activities.refetch()}
              className="mt-2 cursor-pointer text-sm text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty trip or no matching search results */}
        {!activities.isLoading && !activities.error && results.length === 0 && (
          <EmptyState
            title={list.isFiltered ? 'No activities match your search' : 'No activities yet'}
            description={
              list.isFiltered
                ? 'Try a different search or clear your filters.'
                : 'Activities suggested for this trip will appear here.'
            }
            action={
              list.isFiltered ? (
                <button
                  type="button"
                  onClick={list.reset}
                  className="cursor-pointer rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-100"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        )}

        {/* Activity results */}
        {!activities.isLoading && !activities.error && results.length > 0 && (
          <>
            <ActivityList activities={results} onActivityClick={setSelectedActivity} />

            <p className="mt-4 text-sm text-ink-700">
              Showing {results.length} {results.length === 1 ? 'activity' : 'activities'}
            </p>
          </>
        )}
      </div>
      {/* Display the full details of the selected activity. */}
      <ActivityDetailModal
        tripId={tripId}
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </div>
  );
}
