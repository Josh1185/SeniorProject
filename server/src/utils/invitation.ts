/**
 * FILE: invitation.ts
 * DESCRIPTION: Invitation lifetime, and what an invitation's status really is.
 *
 * LAST UPDATED: 2026-11-05 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { InvitationStatus } from "../generated/prisma/enums";

// -------------------- Constants --------------------

/**
 * How long an invitation link works for.
 *
 * Long enough that someone can send it on a Friday and have it still work the
 * weekend after next; short enough that a link forwarded into a group chat a
 * year ago does not still open the trip. The token is a bearer credential -
 * anyone holding it can join - so an unbounded lifetime is the one setting
 * that cannot be defended.
 */
export const INVITE_TTL_DAYS = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// -------------------- Lifetime --------------------

/** When an invitation created now should stop working. */
export function invitationExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + INVITE_TTL_DAYS * MS_PER_DAY);
}

// -------------------- Status --------------------

/**
 * What an invitation's status actually is right now.
 *
 * `status` is a stored column and `expiresAt` is a point in time, so a row can
 * read PENDING long after it stopped working. Nothing sweeps the table - there
 * is no background job - so the two have to be reconciled on every read, and
 * this is the one function that does it.
 *
 * Pure, and the only interesting logic in the module, which is why it is here
 * rather than inlined in the controller: a stored PENDING that is past its
 * expiry is EXPIRED, and everything else is itself.
 */
export function effectiveStatus(
  status: InvitationStatus,
  expiresAt: Date,
  now: Date = new Date(),
): InvitationStatus {
  if (status !== 'PENDING') return status;

  // <= so an invitation is dead on the exact millisecond it expires, not one
  // tick later. Boundaries on a credential round towards the safe side.
  return expiresAt.getTime() <= now.getTime() ? 'EXPIRED' : 'PENDING';
}

/** Whether this invitation can still be accepted or declined. */
export function isActionable(status: InvitationStatus, expiresAt: Date, now: Date = new Date()) {
  return effectiveStatus(status, expiresAt, now) === 'PENDING';
}
