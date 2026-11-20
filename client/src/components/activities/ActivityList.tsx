
/**
 * FILE: ActivityList.tsx
 * DESCRIPTION: Displays activities as desktop rows and mobile cards, including voting controls.
 *
 * LAST UPDATED: 2026-11-19 - Add activity voting controls (Brandon Douglass)
 *               2026-11-06 - Add activity selection support (Brandon Douglass)
 *               2026-11-03 - File Created (Brandon Douglass)
 */

// -------------------- Type imports --------------------
import type { ActivityListItem } from '../../types/api';
import type { Column } from '../list/listTypes';
import type { MouseEvent, KeyboardEvent } from 'react';

// -------------------- Module and lib imports --------------------
import { formatCents, formatDate } from '../../lib/format';

// -------------------- Component imports --------------------
import { DataList } from '../list/DataList';

// -------------------- Props interface --------------------
interface ActivityListProps {
  activities: ActivityListItem[];

  /** Called when a user selects an activity row or mobile card. */
  onActivityClick?: (activity: ActivityListItem) => void;

  /** Called when a user votes or removes their vote. */
  onVote: (activity: ActivityListItem) => void;

  /** ID of the activity currently processing a vote request. */
  votingActivityId?: string | null;
}

// -------------------- Internal Helpers --------------------

/** Displays a readable cost when one has been provided. */
function describeCost(cost: number | null): string {
  return cost === null ? 'Not specified' : formatCents(cost);
}

/** Displays the activity's date and time when scheduled. */
function describeDate(date: string | null): string {
  if (date === null) return 'Not scheduled';

  const time = new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute:  '2-digit',
  });

  return `${formatDate(date)} at ${time}`;
}

/** Displays the number of votes with correct singular/plural wording. */
function describeVotes(count: number): string {
  return `${count} ${count === 1 ? 'vote' : 'votes'}`;
}

/** Prevents voting controls from opening the activity detail modal. */
function stopVoteClick(event: MouseEvent<HTMLButtonElement>) {
  event.stopPropagation();
}

/** Prevents keyboard voting from triggering the parent row. */
function stopVoteKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
  event.stopPropagation();
}

// -------------------- Voting Button --------------------

function VoteButton({
  activity,
  onVote,
  disabled,
}: {
  activity: ActivityListItem;
  onVote: (activity: ActivityListItem) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        stopVoteClick(event);
        onVote(activity);
      }}
      onKeyDown={stopVoteKeyDown}
      disabled={disabled}
      aria-label={`${activity.hasVoted ? 'Remove vote from' : 'Vote for'} ${activity.name}`}
      className={`cursor-pointer rounded-md border px-3 py-1 text-sm font-medium duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
        activity.hasVoted
          ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
          : 'border-ink-300 text-ink-900 hover:bg-ink-100'
      }`}
    >
      {disabled ? 'Saving…' : activity.hasVoted ? 'Unvote' : 'Vote'}
    </button>
  );
}

// -------------------- Mobile Card --------------------

function ActivityCard({
  activity,
  onVote,
  votingActivityId,
}: {
  activity: ActivityListItem;
  onVote: (activity: ActivityListItem) => void;
  votingActivityId?: string | null;
}) {
  return (
    <div className="rounded-lg border border-ink-300 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{activity.name}</p>

          <p className="mt-1 text-sm text-ink-700">
            {activity.locationName ?? 'No location specified'}
          </p>

          <p className="mt-1 text-sm text-ink-700">
            {describeDate(activity.suggestedDateTime)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-medium text-ink-900">
            {describeCost(activity.estimatedCostCents)}
          </p>

          <p className="mt-1 text-sm text-ink-700">
            {describeVotes(activity.voteLength)}
          </p>

          <div className="mt-2">
            <VoteButton
              activity={activity}
              onVote={onVote}
              disabled={votingActivityId === activity.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------- Desktop Columns --------------------

function getActivityColumns(
  onVote: (activity: ActivityListItem) => void,
  votingActivityId?: string | null,
): Column<ActivityListItem>[] {
  return [
    {
      header: 'Activity',
      cell: (activity) => (
        <span className="font-medium text-ink-900">{activity.name}</span>
      ),
    },
    {
      header: 'Location',
      cell: (activity) => activity.locationName ?? 'Not specified',
      className: 'text-sm text-ink-700',
    },
    {
      header: 'Date & Time',
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
    {
      header: 'Your Vote',
      cell: (activity) => (
        <VoteButton
          activity={activity}
          onVote={onVote}
          disabled={votingActivityId === activity.id}
        />
      ),
    },
  ];
}

// -------------------- Component --------------------

export function ActivityList({
  activities,
  onActivityClick,
  onVote,
  votingActivityId,
}: ActivityListProps) {
  return (
    <DataList
      items={activities}
      getKey={(activity) => activity.id}
      columns={getActivityColumns(onVote, votingActivityId)}
      renderCard={(activity) => (
        <ActivityCard
          activity={activity}
          onVote={onVote}
          votingActivityId={votingActivityId}
        />
      )}
      onItemClick={onActivityClick}
    />
  );
}
