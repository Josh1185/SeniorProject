
/**
 * FILE: MembersPage.tsx
 * DESCRIPTION: Displays the complete roster of trip members.
 *
 * OWNER: Yahya Nawaz
 * ISSUE: #112 - M3 Members: List Page (Sprint 2)
 */

// -------------------- Type Imports --------------------

import type { TripMemberSummary } from '../../types/api';
import type { Column } from '../../components/list/listTypes';

// -------------------- Module and Library Imports --------------------

import { Link, useParams } from 'react-router';
import { useTrip } from '../../hooks/trips/useTrip';
import { formatDate } from '../../lib/format';

// -------------------- Component Imports --------------------

import { Avatar } from '../../components/Avatar';
import { DataList } from '../../components/list/DataList';

// -------------------- Internal Components --------------------

/**
 * Displays a member's role.
 */
function MemberRoleBadge({
  role,
}: {
  role: TripMemberSummary['role'];
}) {
  const isOwner = role === 'OWNER';

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        isOwner
          ? 'bg-ink-200 text-ink-900'
          : 'bg-ink-100 text-ink-700'
      }`}
    >
      {isOwner ? 'Owner' : 'Member'}
    </span>
  );
}

/**
 * Mobile card for an individual trip member.
 */
function MemberCard({
  member,
}: {
  member: TripMemberSummary;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-300 bg-white p-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          displayName={member.user.displayName}
          avatarUrl={member.user.avatarUrl}
          size="md"
        />

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-900">
            {member.user.displayName}
          </p>

          <p className="mt-1 text-xs text-ink-700">
            Joined {formatDate(member.joinedAt)}
          </p>
        </div>
      </div>

      <MemberRoleBadge role={member.role} />
    </div>
  );
}

// -------------------- DataList Columns --------------------

const MEMBER_COLUMNS: Column<TripMemberSummary>[] = [
  {
    header: 'Member',
    cell: (member) => (
      <div className="flex items-center gap-3">
        <Avatar
          displayName={member.user.displayName}
          avatarUrl={member.user.avatarUrl}
          size="sm"
        />

        <span className="font-medium text-ink-900">
          {member.user.displayName}
        </span>
      </div>
    ),
  },
  {
    header: 'Role',
    cell: (member) => (
      <MemberRoleBadge role={member.role} />
    ),
  },
  {
    header: 'Date Joined',
    cell: (member) => formatDate(member.joinedAt),
    className: 'text-sm text-ink-700',
  },
];

// -------------------- Main Page Component --------------------

export function MembersPage() {
  // Get the trip ID from the URL.
  const { tripId } = useParams();

  // Retrieve trip information and its members.
  const trip = useTrip(tripId);

  // Loading state.
  if (trip.isLoading) {
    return (
      <div className="rounded-lg border border-ink-300 p-8 text-center">
        <p className="text-sm text-ink-700">
          Loading trip members...
        </p>
      </div>
    );
  }

  // Error state.
  if (trip.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5">
        <h2 className="font-semibold text-red-700">
          Unable to load trip members
        </h2>

        <p className="mt-2 text-sm text-red-700">
          {trip.error instanceof Error
            ? trip.error.message
            : 'An unexpected error occurred.'}
        </p>

        <Link
          to="/dashboard"
          className="mt-3 inline-block text-sm font-medium text-red-700 underline"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  // Handle missing trip data.
  if (!trip.data) {
    return (
      <div className="rounded-lg border border-ink-300 p-8 text-center">
        <p className="text-sm text-ink-700">
          Trip information could not be found.
        </p>
      </div>
    );
  }

  // Extract trip and member information.
  const { trip: tripData } = trip.data;
  const members = tripData.members;

  return (
    <div className="space-y-5">

      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Trip Members
        </h1>

        <p className="mt-1 text-sm text-ink-700">
          View everyone participating in {tripData.name}.
        </p>
      </div>

      {/* Member Count */}
      <div className="rounded-lg border border-ink-300 bg-ink-50 p-4">
        <p className="text-sm font-medium text-ink-700">
          Total Members
        </p>

        <p className="mt-1 text-2xl font-semibold text-ink-900">
          {members.length}
        </p>
      </div>

      {/* Empty State */}
      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 p-12 text-center">
          <h2 className="text-lg font-semibold text-ink-900">
            No members yet
          </h2>

          <p className="mt-1 text-sm text-ink-700">
            There are currently no members in this trip.
          </p>
        </div>
      ) : (
        /* Member Roster */
        <section className="rounded-lg border border-ink-300 bg-ink-50 p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-ink-900">
              Member Roster
            </h2>

            <p className="mt-1 text-sm text-ink-700">
              View each member's name, role, and join date.
            </p>
          </div>

          <DataList
            items={members}
            getKey={(member) => member.user.id}
            columns={MEMBER_COLUMNS}
            renderCard={(member) => (
              <MemberCard member={member} />
            )}
          />
        </section>
      )}
    </div>
  );
}
