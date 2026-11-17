/**
 * FILE: InvitationsPage.tsx
 * DESCRIPTION: The dashboard's Trip Invites tab - what the signed-in user has
 *              been invited to, with Accept and Decline.
 *
 *              NOT a DataList, unlike every other list in the app. These are
 *              not records to scan and compare; they are a short list of
 *              decisions, each needing a trip name, dates, who asked, and two
 *              buttons. A table of two-row lists with an action column reads
 *              worse than cards at any width, so this one is cards at every
 *              width.
 *
 *              THE SERVER ONLY RETURNS LIVE INVITATIONS. Anything accepted,
 *              declined or lapsed is filtered out there, so there is no state
 *              to render here beyond "here is one" and "here are none".
 *
 * LAST UPDATED: 2026-11-16 - Real invitations, accept and decline (Josh Iehle)
 *               2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { MyInvitation } from '../../types/api';

// -------------------- Module and lib imports --------------------
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { describeExpiry } from '../../lib/invitations';
import { formatDateRange } from '../../lib/format';

// -------------------- Hook imports --------------------
import { useAcceptInvitation } from '../../hooks/invitations/useAcceptInvitation';
import { useDeclineInvitation } from '../../hooks/invitations/useDeclineInvitation';
import { useMyInvitations } from '../../hooks/invitations/useMyInvitations';

// -------------------- Component imports --------------------
import { EmptyState } from '../../components/list/EmptyState';

// -------------------- Internal Components --------------------

/** One invitation, with its two decisions. */
function InvitationCard({
  invitation,
  onAccept,
  onDecline,
  busy,
}: {
  invitation: MyInvitation;
  onAccept: (invitation: MyInvitation) => void;
  onDecline: (invitation: MyInvitation) => void;
  busy: 'accept' | 'decline' | null;
}) {
  return (
    <li className="rounded-lg border border-ink-300 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-ink-900">
            {invitation.trip.name}
          </h2>

          <p className="mt-1 text-sm text-ink-700">{invitation.trip.destination}</p>

          <p className="mt-1 text-sm text-ink-700">
            {formatDateRange(invitation.trip.startDate, invitation.trip.endDate)}
          </p>

          <p className="mt-3 text-sm text-ink-700">
            Invited by{' '}
            <span className="font-medium text-ink-900">
              {invitation.invitedBy.displayName}
            </span>
          </p>
        </div>

        <span className="shrink-0 text-xs text-ink-700">
          {describeExpiry(invitation.expiresAt)}
        </span>
      </div>

      {/* flex-col-reverse puts Accept on top on a phone, where the thumb is,
          while keeping Decline on the left at desktop width. */}
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => onDecline(invitation)}
          disabled={busy !== null}
          className="cursor-pointer rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 duration-150 hover:bg-ink-100 disabled:opacity-50"
        >
          {busy === 'decline' ? 'Declining…' : 'Decline'}
        </button>

        <button
          type="button"
          onClick={() => onAccept(invitation)}
          disabled={busy !== null}
          className="cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-brand-700 disabled:opacity-50"
        >
          {busy === 'accept' ? 'Joining…' : 'Accept'}
        </button>
      </div>
    </li>
  );
}

// -------------------- Component --------------------
export function InvitationsPage() {
  const navigate = useNavigate();

  const invitations = useMyInvitations();
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();

  /**
   * Which invitation is mid-request, and which way.
   *
   * Tracked by id rather than reading `isPending` off the mutation, because
   * one mutation instance serves every card - `isPending` alone would disable
   * all of them and show "Joining…" on three cards at once.
   */
  const [busy, setBusy] = useState<{ id: string; action: 'accept' | 'decline' } | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const results = invitations.data?.invitations ?? [];

  // ----- Accept -----
  function handleAccept(invitation: MyInvitation) {
    setBusy({ id: invitation.id, action: 'accept' });
    setActionError(null);

    acceptInvitation.mutate(invitation.token, {
      // Straight into the trip they just joined. The server returns the id
      // for exactly this.
      onSuccess: (data) => navigate(`/trips/${data.tripId}`),
      onError: (error) => {
        setBusy(null);
        setActionError(
          error instanceof Error ? error.message : 'Unable to accept this invitation.',
        );
      },
    });
  }

  // ----- Decline -----
  function handleDecline(invitation: MyInvitation) {
    setBusy({ id: invitation.id, action: 'decline' });
    setActionError(null);

    declineInvitation.mutate(invitation.token, {
      // The card disappears on its own - the hook invalidates the list and
      // the server stops returning resolved invitations.
      onSettled: () => setBusy(null),
      onError: (error) =>
        setActionError(
          error instanceof Error ? error.message : 'Unable to decline this invitation.',
        ),
    });
  }

  // ----- Render -----
  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Trip Invites</h1>
        <p className="mt-1 text-sm text-ink-700">
          Trips you have been invited to join.
        </p>
      </div>

      <div className="mt-6">
        {invitations.isLoading && (
          <p className="py-12 text-center text-ink-700">Loading invitations…</p>
        )}

        {invitations.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">{(invitations.error as Error).message}</p>
            <button
              type="button"
              onClick={() => void invitations.refetch()}
              className="mt-2 cursor-pointer text-sm text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* An accept or decline that failed. Separate from the query error
            above, because the list is fine - one action was not. */}
        {actionError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}

        {!invitations.isLoading && !invitations.error && results.length === 0 && (
          // One empty state, not two. There is no filter on this page, so
          // "nothing matches" cannot happen - empty always means empty.
          <EmptyState
            title="No pending invitations"
            description="When someone invites you to a trip, it will show up here."
          />
        )}

        {results.length > 0 && (
          <ul className="space-y-4">
            {results.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onAccept={handleAccept}
                onDecline={handleDecline}
                busy={busy?.id === invitation.id ? busy.action : null}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
