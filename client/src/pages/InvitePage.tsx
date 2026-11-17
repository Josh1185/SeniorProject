/**
 * FILE: InvitePage.tsx
 * DESCRIPTION: Where an invitation link lands. /invite/:token
 *
 *              THIS IS THE PAGE THAT MAKES THE LINK A LINK. The dashboard tab
 *              only reaches people whose TripSquad account uses the address
 *              the invitation was sent to; this reaches everyone else - the
 *              person who signed up with a different email, the person who
 *              had no account until thirty seconds ago, the person the link
 *              was forwarded to.
 *
 *              IT SITS INSIDE ProtectedRoute, so an signed-out visitor is sent
 *              to log in first. Accepting creates a membership, and a
 *              membership needs a user - there is nobody to add until someone
 *              signs in.
 *
 *              BE HONEST ON THIS PAGE. The token is the whole authorization;
 *              nothing checks that the person reading this is the person it
 *              was addressed to. The page says so rather than implying a check
 *              that does not exist.
 *
 * LAST UPDATED: 2026-11-16 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { formatDateRange } from '../lib/format';
import { describeExpiry } from '../lib/invitations';

// -------------------- Hook imports --------------------
import { useAcceptInvitation } from '../hooks/invitations/useAcceptInvitation';
import { useDeclineInvitation } from '../hooks/invitations/useDeclineInvitation';
import { useInvitationPreview } from '../hooks/invitations/useInvitationPreview';

// -------------------- Internal Components --------------------

/** The card chrome, so every state on this page is the same shape. */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-12 max-w-lg rounded-lg border border-ink-300 bg-ink-50 p-8">
      {children}
    </div>
  );
}

// -------------------- Component --------------------
export function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const preview = useInvitationPreview(token);
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();

  const [actionError, setActionError] = useState<string | null>(null);

  const invitation = preview.data?.invitation;

  // ----- Loading -----
  if (preview.isLoading) {
    return (
      <Panel>
        <p className="text-center text-ink-700">Checking this invitation…</p>
      </Panel>
    );
  }

  // ----- A link that is not good -----
  // Revoked, already used, expired, or never real. The server distinguishes
  // these; the page shows whichever message it sent rather than guessing.
  if (preview.error || !invitation) {
    return (
      <Panel>
        <h1 className="text-xl font-semibold text-ink-900">This invitation is not available</h1>

        <p className="mt-2 text-sm text-ink-700">
          {preview.error instanceof Error
            ? preview.error.message
            : 'The link may have been revoked, already used, or expired.'}
        </p>

        <p className="mt-2 text-sm text-ink-700">
          Ask whoever invited you for a new link.
        </p>

        <Link
          to="/dashboard"
          className="mt-6 inline-block cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-brand-700"
        >
          Go to dashboard
        </Link>
      </Panel>
    );
  }

  // ----- Accept -----
  function handleAccept() {
    if (!token) return;

    setActionError(null);

    acceptInvitation.mutate(token, {
      onSuccess: (data) => navigate(`/trips/${data.tripId}`),
      onError: (error) =>
        setActionError(
          error instanceof Error ? error.message : 'Unable to accept this invitation.',
        ),
    });
  }

  // ----- Decline -----
  function handleDecline() {
    if (!token) return;

    setActionError(null);

    declineInvitation.mutate(token, {
      onSuccess: () => navigate('/dashboard'),
      onError: (error) =>
        setActionError(
          error instanceof Error ? error.message : 'Unable to decline this invitation.',
        ),
    });
  }

  const busy = acceptInvitation.isPending || declineInvitation.isPending;

  // ----- The invitation -----
  return (
    <Panel>
      <p className="text-sm text-ink-700">
        <span className="font-medium text-ink-900">{invitation.invitedBy.displayName}</span>{' '}
        invited you to join
      </p>

      <h1 className="mt-1 text-2xl font-semibold text-ink-900">{invitation.trip.name}</h1>

      <dl className="mt-4 space-y-2">
        <div>
          <dt className="text-xs text-ink-700">Destination</dt>
          <dd className="text-sm font-medium text-ink-900">{invitation.trip.destination}</dd>
        </div>

        <div>
          <dt className="text-xs text-ink-700">Dates</dt>
          <dd className="text-sm font-medium text-ink-900">
            {formatDateRange(invitation.trip.startDate, invitation.trip.endDate)}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-ink-700">{describeExpiry(invitation.expiresAt)}.</p>

      {actionError && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {actionError}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleDecline}
          disabled={busy}
          className="cursor-pointer rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 duration-150 hover:bg-ink-100 disabled:opacity-50"
        >
          {declineInvitation.isPending ? 'Declining…' : 'Decline'}
        </button>

        <button
          type="button"
          onClick={handleAccept}
          disabled={busy}
          className="cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-brand-700 disabled:opacity-50"
        >
          {acceptInvitation.isPending ? 'Joining…' : 'Accept and join'}
        </button>
      </div>

      {/* Stated rather than implied. Someone who was forwarded this link can
          join, and the person who sent it should not be surprised by that. */}
      <p className="mt-4 text-xs text-ink-700">
        Accepting adds your account to this trip. Anyone with this link can join, so do not
        share it further.
      </p>
    </Panel>
  );
}
