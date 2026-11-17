/**
 * FILE: TripInvitationList.tsx
 * DESCRIPTION: The owner's view of every invitation sent for one trip, built
 *              on DataList.
 *
 *              THE COPY BUTTON ONLY APPEARS ON PENDING ROWS. An accepted or
 *              expired invitation still has a token in the response, but its
 *              link does nothing - offering to copy it would hand someone a
 *              URL that 404s and no way to tell why.
 *
 * LAST UPDATED: 2026-11-16 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { TripInvitation } from '../../types/api';
import type { Column } from '../list/listTypes';

// -------------------- Module and lib imports --------------------
import { useState } from 'react';
import { buildInviteUrl, describeExpiry } from '../../lib/invitations';
import { formatDate } from '../../lib/format';

// -------------------- Component imports --------------------
import { DataList } from '../list/DataList';
import { InvitationStatusBadge } from './InvitationStatusBadge';

// -------------------- Props interface --------------------
interface TripInvitationListProps {
  invitations: TripInvitation[];
  onRevoke: (invitation: TripInvitation) => void;
  /** The id currently being revoked, so only that row's button goes quiet. */
  revokingId?: string;
}

// -------------------- Internal Components --------------------

/** Copies one invitation's link, with its own "Copied" state. */
function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildInviteUrl(token));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent. The full link with a manual fallback lives in the invite
      // modal; a row button is not the place to explain clipboard permissions.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="cursor-pointer rounded-md border border-ink-300 px-3 py-1 text-xs font-medium text-ink-900 duration-150 hover:bg-ink-100"
    >
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}

/** The per-row actions, shared by the table and the card. */
function RowActions({
  invitation,
  onRevoke,
  revokingId,
}: {
  invitation: TripInvitation;
  onRevoke: (invitation: TripInvitation) => void;
  revokingId?: string;
}) {
  if (invitation.status !== 'PENDING') return null;

  const isRevoking = revokingId === invitation.id;

  return (
    <div className="flex gap-2">
      <CopyLinkButton token={invitation.token} />

      <button
        type="button"
        onClick={() => onRevoke(invitation)}
        disabled={isRevoking}
        className="cursor-pointer rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 duration-150 hover:bg-red-50 disabled:opacity-50"
      >
        {isRevoking ? 'Revoking…' : 'Revoke'}
      </button>
    </div>
  );
}

/** One mobile card. */
function InvitationCard({
  invitation,
  onRevoke,
  revokingId,
}: {
  invitation: TripInvitation;
  onRevoke: (invitation: TripInvitation) => void;
  revokingId?: string;
}) {
  return (
    <div className="rounded-lg border border-ink-300 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-900">{invitation.email}</p>
          <p className="mt-1 text-xs text-ink-700">Sent {formatDate(invitation.createdAt)}</p>
          {invitation.status === 'PENDING' && (
            <p className="mt-1 text-xs text-ink-700">{describeExpiry(invitation.expiresAt)}</p>
          )}
        </div>

        <InvitationStatusBadge status={invitation.status} />
      </div>

      <div className="mt-3">
        <RowActions invitation={invitation} onRevoke={onRevoke} revokingId={revokingId} />
      </div>
    </div>
  );
}

// -------------------- Component --------------------
export function TripInvitationList({
  invitations,
  onRevoke,
  revokingId,
}: TripInvitationListProps) {
  // Built inside the component rather than at module scope: the action column
  // closes over onRevoke, which is a prop. Rebuilding a four-element array
  // per render costs nothing.
  const columns: Column<TripInvitation>[] = [
    {
      header: 'Email',
      cell: (invitation) => (
        <span className="font-medium text-ink-900">{invitation.email}</span>
      ),
    },
    {
      header: 'Status',
      cell: (invitation) => <InvitationStatusBadge status={invitation.status} />,
    },
    {
      header: 'Sent',
      cell: (invitation) => formatDate(invitation.createdAt),
      className: 'text-sm text-ink-700',
    },
    {
      header: 'Expires',
      // Blank rather than "Expired" on a resolved row - an accepted
      // invitation's expiry date is noise, and printing it invites the reader
      // to wonder whether it stopped working.
      cell: (invitation) =>
        invitation.status === 'PENDING' ? describeExpiry(invitation.expiresAt) : '',
      className: 'text-sm text-ink-700',
    },
    {
      header: 'Actions',
      cell: (invitation) => (
        <RowActions invitation={invitation} onRevoke={onRevoke} revokingId={revokingId} />
      ),
    },
  ];

  return (
    <DataList
      items={invitations}
      getKey={(invitation) => invitation.id}
      columns={columns}
      renderCard={(invitation) => (
        <InvitationCard
          invitation={invitation}
          onRevoke={onRevoke}
          revokingId={revokingId}
        />
      )}
    />
  );
}
