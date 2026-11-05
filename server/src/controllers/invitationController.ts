/**
 * FILE: invitationController.ts
 * DESCRIPTION: Endpoint controllers for the invitation module.
 *
 *              THIS MODULE BREAKS THE RULE IN conventions.md, deliberately.
 *
 *              Every other feature mounts under /api/trips/:tripId behind
 *              requireTripRole(), and that guard is what lets its controllers
 *              skip permission checks entirely. Invitations cannot work that
 *              way in two places:
 *
 *                - the person ACCEPTING is not a member of the trip yet, so
 *                  requireTripRole() would 404 them before the controller ran
 *                - the dashboard's Trip Invites tab lists your invitations
 *                  BEFORE you have joined anything, so there is no :tripId to
 *                  scope to
 *
 *              So the file holds two groups of handlers with different
 *              guarantees, and they are kept visually apart below:
 *
 *                OWNER HANDLERS mount behind requireTripRole('OWNER'). By the
 *                time they run, the caller owns the trip in the URL. Same
 *                contract as every other controller.
 *
 *                CALLER HANDLERS mount behind requireAuth only. NOTHING has
 *                been checked except that someone is signed in. Every one of
 *                them does its own authorization, and the comments say what.
 *
 *              THE TOKEN IS THE AUTHORIZATION. Accepting does not check that
 *              the signed-in user's email matches the invitation's. That is a
 *              deliberate product decision: invitations travel as a copyable
 *              link, and a link that only works for one address is not a link.
 *              The email decides whose Trip Invites tab it appears in and
 *              nothing more. Anyone who gets hold of the link can join the
 *              trip - say that plainly rather than implying a check exists.
 *
 * LAST UPDATED: 2026-11-05 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { Request, Response } from 'express';

// -------------------- Module imports --------------------
import { prisma } from '../lib/prisma';

// -------------------- Schema imports --------------------
import { createInvitationSchema } from '../schemas/invitationSchemas';

// -------------------- Util imports --------------------
import badRequest from '../utils/badRequest';
import notFound from '../utils/notFound';
import unauthorized from '../utils/unauthorized';
import { effectiveStatus, invitationExpiresAt, isActionable } from '../utils/invitation';
import { isPlausibleToken, newInviteToken } from '../utils/inviteToken';

// -------------------- Shared Selects --------------------

/**
 * What an OWNER sees about an invitation they sent.
 *
 * Includes the token, because the owner is the person who has to copy the
 * link. This select must never be used on a route that is not owner-gated.
 */
const invitationOwnerSelect = {
  id: true,
  email: true,
  token: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  invitedBy: { select: { id: true, displayName: true } },
};

/**
 * What an INVITEE sees about an invitation addressed to them.
 *
 * No `email` - they know their own address - but it does carry the trip, since
 * the dashboard tab has to show what they are being invited to before they
 * have any access to it.
 */
const invitationMineSelect = {
  id: true,
  token: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  invitedBy: { select: { id: true, displayName: true } },
  trip: {
    select: {
      id: true,
      name: true,
      destination: true,
      startDate: true,
      endDate: true,
    },
  },
};

// -------------------- Internal Helpers --------------------

/**
 * The signed-in user's email address.
 *
 * req.user carries the id from the JWT, not the email, so this is a lookup.
 * It is the only way to answer "which invitations are mine" - invitations are
 * addressed to an email because the invitee may not have had an account when
 * they were sent.
 */
async function currentUserEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  return user?.email.toLowerCase() ?? null;
}

// =============================================================================
// OWNER HANDLERS - mounted behind requireAuth + requireTripRole('OWNER')
// =============================================================================

// -------------------- POST /api/trips/:tripId/invitations --------------------

/**
 * Invites an email address to this trip and returns the link to send them.
 */
export async function createInvitation(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve the trip id from the req params -----
  const tripId = req.params.tripId;

  // ----- 3. Validate that the trip ID exists as a string -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 4. Validate and retrieve request body -----
  // The schema trims and lowercases the address before checking its format,
  // so everything from here down is comparing normalised values.
  const body = createInvitationSchema.parse(req.body);

  // ----- 5. Is this person already on the trip? -----
  // Invitations are addressed to an email, which may belong to nobody yet.
  // When it does belong to someone, inviting a member again is a mistake
  // worth naming rather than a second invitation worth creating.
  const invitedUser = await prisma.user.findFirst({
    where: { email: { equals: body.email, mode: 'insensitive' } },
    select: { id: true },
  });

  if (invitedUser) {
    const membership = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: invitedUser.id } },
      select: { userId: true },
    });

    if (membership) {
      return badRequest(res, 'That person is already a member of this trip');
    }
  }

  // ----- 6. Is there already a live invitation for this address? -----
  //
  // There is deliberately no @@unique([tripId, email]) on the table - that
  // would block re-inviting someone who declined - so this is the check that
  // stops an owner producing five live links for one person by clicking twice.
  //
  // Scoped to PENDING and unexpired: a declined, accepted or lapsed invitation
  // should not block a fresh one.
  const existing = await prisma.tripInvitation.findFirst({
    where: {
      tripId,
      email: { equals: body.email, mode: 'insensitive' },
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (existing) {
    return badRequest(res, 'There is already a pending invitation for that email address');
  }

  // ----- 7. Create the invitation -----
  const invitation = await prisma.tripInvitation.create({
    data: {
      tripId,
      invitedById: req.user.id,
      email: body.email,
      token: newInviteToken(),
      expiresAt: invitationExpiresAt(),
    },
    select: invitationOwnerSelect,
  });

  // ----- 8. Respond with 201 and the created invitation -----
  res.status(201).json({ invitation });
}

// -------------------- GET /api/trips/:tripId/invitations --------------------

/**
 * Every invitation sent for this trip, in any state.
 */
export async function listInvitations(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve the trip id from the req params -----
  const tripId = req.params.tripId;

  // ----- 3. Validate that the trip ID exists as a string -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 4. Fetch every invitation on this trip -----
  const invitations = await prisma.tripInvitation.findMany({
    where: { tripId },
    orderBy: { createdAt: 'desc' },
    select: invitationOwnerSelect,
  });

  // ----- 5. Reconcile the stored status with the clock -----
  //
  // Nothing sweeps this table, so a row can still read PENDING long after it
  // stopped working. The status is recomputed on the way out rather than
  // written back: a GET that quietly writes to the database is a surprise, and
  // the row is corrected the next time someone actually tries to use it.
  const now = new Date();

  const payload = invitations.map((invitation) => ({
    ...invitation,
    status: effectiveStatus(invitation.status, invitation.expiresAt, now),
  }));

  // ----- 6. Respond -----
  res.json({ invitations: payload });
}

// -------------------- DELETE /api/trips/:tripId/invitations/:invitationId ----

/**
 * Revokes a pending invitation, which kills its link.
 *
 * A real delete rather than an EXPIRED status, for two reasons: the token goes
 * with the row, so a revoked link stops working outright rather than relying
 * on a status check; and the enum has no REVOKED member, so storing one would
 * mean a migration to record something nobody queries.
 */
export async function revokeInvitation(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve both ids from the req params -----
  const tripId = req.params.tripId;
  const invitationId = req.params.invitationId;

  // ----- 3. Validate that both IDs exist as strings -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  if (typeof invitationId !== 'string') {
    return badRequest(res, 'Missing invitation id');
  }

  // ----- 4. Look it up, scoped to THIS trip -----
  // Both ids in the where clause. requireTripRole('OWNER') proved the caller
  // owns the trip in the URL; it did not prove this invitation belongs to it.
  const invitation = await prisma.tripInvitation.findFirst({
    where: { id: invitationId, tripId },
    select: { id: true, status: true, expiresAt: true },
  });

  if (!invitation) {
    return notFound(res, 'Invitation not found');
  }

  // ----- 5. Only a live invitation can be revoked -----
  // Deleting an ACCEPTED one would look like it removed the member it created,
  // and it would not. Say so instead.
  if (!isActionable(invitation.status, invitation.expiresAt)) {
    return badRequest(
      res,
      'Only a pending invitation can be revoked. This one has already been used or has expired.',
    );
  }

  // ----- 6. Delete it -----
  await prisma.tripInvitation.delete({ where: { id: invitation.id } });

  // ----- 7. Respond with a 204 -----
  res.status(204).end();
}

// =============================================================================
// CALLER HANDLERS - mounted behind requireAuth ONLY
//
// Nothing below here has had any trip permission checked. Each handler is
// responsible for its own authorization, and each one says what that is.
// =============================================================================

// -------------------- GET /api/invitations --------------------

/**
 * The signed-in user's own pending invitations, for the dashboard tab.
 *
 * AUTHORIZATION: the email filter IS the authorization. A row is only returned
 * when it was addressed to the caller's own address, which is why the address
 * is read from the database by id rather than taken from anything the client
 * sent.
 */
export async function listMyInvitations(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Find out who is asking -----
  const email = await currentUserEmail(req.user.id);

  if (!email) {
    // A valid JWT for a user with no row. Means the user record was deleted
    // mid-session, so there is nothing addressed to them.
    return res.json({ invitations: [] });
  }

  // ----- 3. Fetch the live ones addressed to them -----
  //
  // `mode: 'insensitive'` rather than relying on both sides being lowercase.
  // The schema lowercases every address an owner types, but User.email comes
  // from Supabase and this comparison has to hold whatever case it arrives in.
  // It does mean Postgres cannot use the [email, status] index - at this scale
  // that is a trade worth making for a comparison that cannot silently miss.
  //
  // Expired rows are filtered out here rather than shown greyed: this endpoint
  // feeds a list of things you can act on, and an invitation you cannot accept
  // is not one of them.
  const invitations = await prisma.tripInvitation.findMany({
    where: {
      email: { equals: email, mode: 'insensitive' },
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: invitationMineSelect,
  });

  // ----- 4. Respond -----
  res.json({ invitations });
}

// -------------------- POST /api/invitations/:token/accept --------------------

/**
 * Accepts an invitation and joins the trip.
 *
 * AUTHORIZATION: holding the token. There is no check that the caller's email
 * matches the invitation's - see the note at the top of this file.
 *
 * THE WHOLE THING IS ONE TRANSACTION because it writes to two tables. A
 * membership created without the invitation being marked accepted would leave
 * a live link that joins the trip again on every click; an invitation marked
 * accepted without the membership would lock someone out of a trip they just
 * accepted, with no way back in.
 */
export async function acceptInvitation(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  const userId = req.user.id;

  // ----- 2. Retrieve and sanity-check the token -----
  const token = req.params.token;

  if (!isPlausibleToken(token)) {
    // Not a security check - the lookup below decides what is real. This just
    // keeps a megabyte of junk from reaching an indexed query.
    return notFound(res, 'Invitation not found');
  }

  // ----- 3. Join the trip and resolve the invitation, atomically -----
  //
  // The handler returns a tagged outcome rather than writing the response
  // from inside the transaction: a response sent mid-transaction would be
  // claiming something that could still roll back.
  const outcome = await prisma.$transaction(async (tx) => {
    const invitation = await tx.tripInvitation.findUnique({
      where: { token },
      select: { id: true, tripId: true, status: true, expiresAt: true },
    });

    if (!invitation) {
      return { kind: 'not_found' as const };
    }

    // ----- Already used? -----
    if (invitation.status !== 'PENDING') {
      return { kind: 'not_pending' as const, status: invitation.status };
    }

    // ----- Lapsed? -----
    // Written back this time, unlike in the list: we are already in a write
    // transaction, and flipping it here means the owner's list stops showing
    // a PENDING row that nobody can use.
    if (!isActionable(invitation.status, invitation.expiresAt)) {
      await tx.tripInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });

      return { kind: 'expired' as const };
    }

    // ----- Join -----
    // Checked rather than blindly created: TripMember has
    // @@unique([tripId, userId]), so a second create for someone who is
    // already on the trip would raise P2002 and surface as a 500. Someone
    // invited twice, or who joined another way before clicking, is not an
    // error - the invitation just resolves.
    const membership = await tx.tripMember.findUnique({
      where: { tripId_userId: { tripId: invitation.tripId, userId } },
      select: { userId: true },
    });

    if (!membership) {
      await tx.tripMember.create({
        data: { tripId: invitation.tripId, userId, role: 'MEMBER' },
      });
    }

    await tx.tripInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    return { kind: 'accepted' as const, tripId: invitation.tripId };
  });

  // ----- 4. Map the outcome onto a response -----
  switch (outcome.kind) {
    case 'not_found':
      return notFound(res, 'Invitation not found');

    case 'expired':
      return badRequest(res, 'This invitation has expired. Ask the trip owner for a new link.');

    case 'not_pending':
      return badRequest(
        res,
        outcome.status === 'ACCEPTED'
          ? 'This invitation has already been accepted'
          : 'This invitation is no longer available',
      );

    case 'accepted':
      // The trip id is the point of the response: the client navigates
      // straight into the trip the user just joined.
      return res.json({ tripId: outcome.tripId });
  }
}

// -------------------- POST /api/invitations/:token/decline -------------------

/**
 * Declines an invitation. Creates nothing; only resolves the invitation.
 *
 * AUTHORIZATION: holding the token, same as accept.
 *
 * Declining is NOT a delete. The row stays so the owner's list can show that
 * it was turned down rather than silently vanishing, and so a fresh invitation
 * to the same address is still allowed - which is exactly why the table has no
 * unique constraint on (tripId, email).
 */
export async function declineInvitation(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve and sanity-check the token -----
  const token = req.params.token;

  if (!isPlausibleToken(token)) {
    return notFound(res, 'Invitation not found');
  }

  // ----- 3. Resolve it -----
  // One table, but still a transaction-free read-then-write, so the status is
  // re-checked in the update's own where clause below.
  const invitation = await prisma.tripInvitation.findUnique({
    where: { token },
    select: { id: true, status: true, expiresAt: true },
  });

  if (!invitation) {
    return notFound(res, 'Invitation not found');
  }

  if (!isActionable(invitation.status, invitation.expiresAt)) {
    return badRequest(res, 'This invitation is no longer available');
  }

  // `status: 'PENDING'` in the where clause, not just the id: it makes the
  // update a no-op if something resolved this invitation between the read
  // above and this write. updateMany rather than update so that losing that
  // race is a count of 0 rather than a P2025 and a 500.
  const result = await prisma.tripInvitation.updateMany({
    where: { id: invitation.id, status: 'PENDING' },
    data: { status: 'DECLINED' },
  });

  if (result.count === 0) {
    return badRequest(res, 'This invitation is no longer available');
  }

  // ----- 4. Respond with a 204 -----
  res.status(204).end();
}
