/**
 * FILE: ActivityList.tsx
 * DESCRIPTION: Displays activities as desktop rows and mobile cards.
 * LAST UPDATED: 2026-11-06 - Add activity selection support (Brandon Douglass)
 *               2026-11-03 - File Created (Brandon Douglass)
 */

// -------------------- Type imports --------------------
import type { ActivityListItem } from '../../types/api';
import type { Column } from '../list/listTypes';

// -------------------- Module and lib imports --------------------
import { formatCents, formatDate } from '../../lib/format';

// -------------------- Component imports --------------------
import { DataList } from '../list/DataList';

// -------------------- Props interface --------------------
interface ActivityListProps {
  activities: ActivityListItem[];

  /** Called when a user selects an activity row or mobile card. */
  onActivityClick?: (activity: ActivityListItem) => void;
}

// -------------------- Internal Helpers --------------------

/** Displays a readable cost when one has been provided. */
function describeCost(cost: number | null): string {
  return cost === null ? 'Not specified' : formatCents(cost);
}

/** Displays a readable date when one has been suggested. */
function describeDate(date: string | null): string {
  return date === null ? 'Not scheduled' : formatDate(date);
}

/** Displays the number of votes with correct singular/plural wording. */
function describeVotes(count: number): string {
  return `${count} ${count === 1 ? 'vote' : 'votes'}`;
}

// -------------------- Mobile Card --------------------

function ActivityCard({ activity }: { activity: ActivityListItem }) {
  return (
    <div className="rounded-lg border border-ink-300 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{activity.name}</p>

          <p className="mt-1 text-sm text-ink-700">
            {activity.locationName ?? 'No location specified'}
          </p>

          <p className="mt-1 text-sm text-ink-700">{describeDate(activity.suggestedDateTime)}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-medium text-ink-900">{describeCost(activity.estimatedCostCents)}</p>

          <p className="mt-1 text-sm text-ink-700">{describeVotes(activity.voteLength)}</p>
        </div>
      </div>
    </div>
  );
}

// -------------------- Desktop Columns --------------------

const ACTIVITY_COLUMNS: Column<ActivityListItem>[] = [
  {
    header: 'Activity',
    cell: (activity) => <span className="font-medium text-ink-900">{activity.name}</span>,
  },
  {
    header: 'Location',
    cell: (activity) => activity.locationName ?? 'Not specified',
    className: 'text-sm text-ink-700',
  },
  {
    header: 'Suggested Date',
    cell: (activity) => describeDate(activity.suggestedDateTime),
    className: 'text-sm text-ink-700',
  },
  {
    header: 'Estimated Cost',
    cell: (activity) => describeCost(activity.estimatedCostCents),
    className: 'text-sm text-ink-700',
  },
  {
    header: 'Votes',
    cell: (activity) => describeVotes(activity.voteLength),
    className: 'text-sm text-ink-700',
  },
];

// -------------------- Component --------------------

export function ActivityList({ activities, onActivityClick }: ActivityListProps) {
  return (
    <DataList
      items={activities}
      getKey={(activity) => activity.id}
      columns={ACTIVITY_COLUMNS}
      renderCard={(activity) => <ActivityCard activity={activity} />}
      onItemClick={onActivityClick}
    />
  );
}
