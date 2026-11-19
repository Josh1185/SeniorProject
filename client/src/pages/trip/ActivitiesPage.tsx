/**
 * FILE: ActivitiesPage.tsx
 * DESCRIPTION: Displays a trip's activities with search, sorting,
 *              voting, loading/error handling, and empty states.
 *
 * LAST UPDATED: 2026-11-19 - Connect activity voting and un-voting (Brandon Douglass)
 *               2026-11-12 - Connect activity creation, edit, delete modal (Brandon Douglass)
 *               2026-11-06 - Connect Activities detail modal (Brandon Douglass)
 *               2026-11-03 - Build Activities list page (Brandon Douglass)
 *               2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ActivityDetail, ActivityListItem } from '../../types/api';
import type { ActivityFilters } from '../../services/activityService';

// -------------------- Module and lib imports --------------------
import { useState } from 'react';
import { useParams } from 'react-router';
import { unpackSort } from '../../lib/listParams';

// -------------------- Hook imports --------------------
import { useActivities } from '../../hooks/activities/useActivities';
import { useListQueryState } from '../../hooks/useListQueryState';
import { useDeleteActivity } from '../../hooks/activities/useDeleteActivity';
import {
  useVoteForActivity,
  useRemoveActivityVote,
} from '../../hooks/activities/useActivityVoting';

// -------------------- Component imports --------------------
import { ActivityDetailModal } from '../../components/activities/ActivityDetailModal';
import { ActivityList } from '../../components/activities/ActivityList';
import { EmptyState } from '../../components/list/EmptyState';
import { ListToolbar } from '../../components/list/ListToolbar';
import { ActivityFormModal } from '../../components/activities/ActivityFormModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';

// -------------------- List defaults --------------------

const ACTIVITY_LIST_DEFAULTS = {
  search: '',
  sort: 'createdAt:desc',
};

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
  const { tripId } = useParams();

  // -------------------- Modal and error state --------------------

  const [selectedActivity, setSelectedActivity] = useState<ActivityListItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityDetail | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<ActivityDetail | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  // -------------------- List filters --------------------

  const list = useListQueryState({ defaults: ACTIVITY_LIST_DEFAULTS });

  const { sort, order } = unpackSort(list.values.sort, 'createdAt', 'desc');

  const filters: ActivityFilters = {
    search: list.values.search || undefined,
    sort: sort as ActivityFilters['sort'],
    order: order as ActivityFilters['order'],
  };

  // -------------------- Activity queries and mutations --------------------

  const activities = useActivities(tripId, filters);
  const deleteActivity = useDeleteActivity(tripId ?? '');

  const voteForActivity = useVoteForActivity(tripId ?? '');
  const removeActivityVote = useRemoveActivityVote(tripId ?? '');

  const votingActivityId = voteForActivity.isPending
    ? voteForActivity.variables
    : removeActivityVote.isPending
      ? removeActivityVote.variables
      : null;

  const results = activities.data?.activities ?? [];

  // -------------------- Voting handler --------------------

  async function handleVote(activity: ActivityListItem) {
    if (voteForActivity.isPending || removeActivityVote.isPending) return;

    setVoteError(null);

    try {
      if (activity.hasVoted) {
        await removeActivityVote.mutateAsync(activity.id);
      } else {
        await voteForActivity.mutateAsync(activity.id);
      }
    } catch (error) {
      setVoteError(error instanceof Error ? error.message : 'Unable to update vote.');
    }
  }

  // -------------------- Page layout --------------------

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Trip Activities</h1>
          <p className="mt-1 text-sm text-ink-700">Explore activities suggested for this trip.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-brand-700"
        >
          Add Activity
        </button>
      </div>

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
        {activities.isLoading && (
          <p className="py-12 text-center text-ink-700">Loading activities…</p>
        )}

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

        {!activities.isLoading && !activities.error && results.length > 0 && (
          <>
            <ActivityList
              activities={results}
              onActivityClick={setSelectedActivity}
              onVote={(activity) => void handleVote(activity)}
              votingActivityId={votingActivityId}
            />

            <p className="mt-4 text-sm text-ink-700">
              Showing {results.length} {results.length === 1 ? 'activity' : 'activities'}
            </p>
          </>
        )}
      </div>

      {/* -------------------- Voting error -------------------- */}

      {voteError && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{voteError}</p>
        </div>
      )}

      {/* -------------------- Activity detail modal -------------------- */}

      <ActivityDetailModal
        tripId={tripId}
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onEdit={(activity) => {
          setSelectedActivity(null);
          setEditingActivity(activity);
        }}
        onDelete={(activity) => {
          setSelectedActivity(null);
          setDeleteError(null);
          setDeletingActivity(activity);
        }}
      />

      {/* -------------------- Create activity modal -------------------- */}

      {showCreateModal && (
        <ActivityFormModal
          key="create-activity"
          open={showCreateModal}
          tripId={tripId}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* -------------------- Edit activity modal -------------------- */}

      {editingActivity && (
        <ActivityFormModal
          key={editingActivity.id}
          open={true}
          tripId={tripId}
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
        />
      )}

      {/* -------------------- Delete error -------------------- */}

      {deleteError && deletingActivity && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-100 max-w-sm rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 shadow-lg"
        >
          <p className="font-medium">Unable to delete activity</p>
          <p className="mt-1">{deleteError}</p>
        </div>
      )}

      {/* -------------------- Delete confirmation -------------------- */}

      <ConfirmDialog
        open={Boolean(deletingActivity)}
        onClose={() => {
          setDeletingActivity(null);
          setDeleteError(null);
        }}
        title="Delete Activity"
        description={`Are you sure you want to delete "${deletingActivity?.name ?? ''}"? This action cannot be undone.`}
        confirmLabel="Delete Activity"
        destructive
        pending={deleteActivity.isPending}
        onConfirm={async () => {
          if (!deletingActivity) return;

          setDeleteError(null);

          try {
            await deleteActivity.mutateAsync(deletingActivity.id);
            setDeletingActivity(null);
          } catch (error) {
            setDeleteError(error instanceof Error ? error.message : 'Unable to delete activity.');
          }
        }}
      />
    </div>
  );
}
