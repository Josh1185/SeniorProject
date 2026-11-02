
/**
 * FILE: MembersPage.tsx
 * DESCRIPTION: Displays the trip member roster, member details,
 *              and member management actions.
 *
 * OWNER: Yahya Nawaz
 * ISSUES:
 * #112 - M3 Members: List Page (Sprint 2)
 * #113 - M4 Members: Member Detail Modal (Sprint 2)
 * #114 - M5 Members: Role Change, Remove, Leave UI (Sprint 2)
 */

// -------------------- Type Imports --------------------

import type { TripMemberSummary, TripRole } from '../../types/api';
import type { Column } from '../../components/list/listTypes';

// -------------------- Module and Library Imports --------------------

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTrip } from '../../hooks/trips/useTrip';
import { useChangeTripMemberRole } from '../../hooks/trips/useChangeTripMemberRole';
import { useRemoveTripMember } from '../../hooks/trips/useRemoveTripMember';
import { useLeaveTrip } from '../../hooks/trips/useLeaveTrip';
import { formatDate } from '../../lib/format';

// -------------------- Component Imports --------------------

import { Avatar } from '../../components/Avatar';
import { DataList } from '../../components/list/DataList';
import {
  DetailModal,
  DetailField,
} from '../../components/DetailModal';

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
  // Get trip ID from URL.
  const { tripId } = useParams();

  // Navigation.
  const navigate = useNavigate();

  // Retrieve trip information and members.
  const trip = useTrip(tripId);

  // M5 mutation hooks.
  const changeRole = useChangeTripMemberRole(tripId ?? '');
  const removeMember = useRemoveTripMember(tripId ?? '');
  const leaveTrip = useLeaveTrip(tripId ?? '');

  // Track selected member for detail modal.
  const [selectedMember, setSelectedMember] =
    useState<TripMemberSummary | null>(null);

  // Track action errors.
  const [actionError, setActionError] = useState<string | null>(null);

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
  const { trip: tripData, yourRole } = trip.data;
  const members = tripData.members;

  // Determine whether the signed-in user is an owner.
  const isCurrentUserOwner = yourRole === 'OWNER';

  // Count trip owners.
  const ownerCount = members.filter(
    (member) => member.role === 'OWNER',
  ).length;

  // Determine whether the selected member is the only owner.
  const isLastOwner =
    selectedMember?.role === 'OWNER' && ownerCount === 1;

  // -------------------- Change Member Role --------------------

  function handleRoleChange(role: TripRole) {
    if (!selectedMember || !tripId) return;

    setActionError(null);

    changeRole.mutate(
      {
        userId: selectedMember.user.id,
        role,
      },
      {
        onSuccess: (response) => {
          setSelectedMember(response.member);
        },
        onError: (error) => {
          setActionError(
            error instanceof Error
              ? error.message
              : 'Unable to change member role.',
          );
        },
      },
    );
  }

  // -------------------- Remove Member --------------------

  function handleRemoveMember() {
    if (!selectedMember || !tripId) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${selectedMember.user.displayName} from this trip?`,
    );

    if (!confirmed) return;

    setActionError(null);

    removeMember.mutate(selectedMember.user.id, {
      onSuccess: () => {
        setSelectedMember(null);
      },
      onError: (error) => {
        setActionError(
          error instanceof Error
            ? error.message
            : 'Unable to remove this member.',
        );
      },
    });
  }

  // -------------------- Leave Trip --------------------

  function handleLeaveTrip() {
    if (!tripId) return;

    const confirmed = window.confirm(
      `Are you sure you want to leave "${tripData.name}"?`,
    );

    if (!confirmed) return;

    setActionError(null);

    leaveTrip.mutate(undefined, {
      onSuccess: () => {
        navigate('/dashboard');
      },
      onError: (error) => {
        setActionError(
          error instanceof Error
            ? error.message
            : 'Unable to leave this trip.',
        );
      },
    });
  }

  return (
    <div className="space-y-5">

      {/* Page Heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            Trip Members
          </h1>

          <p className="mt-1 text-sm text-ink-700">
            View everyone participating in {tripData.name}.
          </p>
        </div>

        {/* Leave Trip Button */}
        <button
          type="button"
          onClick={handleLeaveTrip}
          disabled={leaveTrip.isPending}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {leaveTrip.isPending ? 'Leaving...' : 'Leave Trip'}
        </button>
      </div>

      {/* Action Error Message */}
      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

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
              Select a member to view their details.
            </p>
          </div>

          <DataList
            items={members}
            getKey={(member) => member.user.id}
            columns={MEMBER_COLUMNS}
            renderCard={(member) => (
              <MemberCard member={member} />
            )}
            onItemClick={setSelectedMember}
          />
        </section>
      )}

      {/* Member Detail Modal */}
      <DetailModal
        open={selectedMember !== null}
        onClose={() => setSelectedMember(null)}
        title={selectedMember?.user.displayName ?? 'Member Details'}
      >
        {selectedMember && (
          <>
            <DetailField label="Member" full>
              <div className="flex items-center gap-3">
                <Avatar
                  displayName={selectedMember.user.displayName}
                  avatarUrl={selectedMember.user.avatarUrl}
                  size="lg"
                />

                <span>
                  {selectedMember.user.displayName}
                </span>
              </div>
            </DetailField>

            <DetailField label="Role">
              <MemberRoleBadge role={selectedMember.role} />
            </DetailField>

            <DetailField label="Date Joined">
              {formatDate(selectedMember.joinedAt)}
            </DetailField>

            {/* M5: Owner Management Controls */}
            {isCurrentUserOwner && !isLastOwner && (
              <>
                <DetailField label="Change Role" full>
                  <select
                    value={selectedMember.role}
                    onChange={(event) =>
                      handleRoleChange(
                        event.target.value as TripRole,
                      )
                    }
                    disabled={changeRole.isPending}
                    className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 disabled:opacity-50"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="OWNER">Owner</option>
                  </select>

                  {changeRole.isPending && (
                    <p className="mt-1 text-xs text-ink-700">
                      Updating role...
                    </p>
                  )}
                </DetailField>

                <DetailField label="Member Management" full>
                  <button
                    type="button"
                    onClick={handleRemoveMember}
                    disabled={removeMember.isPending}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {removeMember.isPending
                      ? 'Removing...'
                      : 'Remove Member'}
                  </button>
                </DetailField>
              </>
            )}

            {/* Last Owner Protection */}
            {isLastOwner && (
              <p className="text-sm text-ink-700">
                This member is the only owner of this trip.
                Their role cannot be changed and they cannot
                be removed.
              </p>
            )}

            {/* Non-owner Information */}
            {!isCurrentUserOwner && (
              <p className="text-sm text-ink-700">
                Only trip owners can change member roles or
                remove members.
              </p>
            )}
          </>
        )}
      </DetailModal>

    </div>
  );
}
