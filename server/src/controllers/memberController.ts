/**
 * FILE: memberController.ts
 * DESCRIPTION: Endpoint controllers for the member module.
 *
 * LAST UPDATED: 2026-10-26 - File Created (Yahya Nawaz)
 */

// -------------------- Type imports --------------------
import type { Request, Response } from 'express';

// -------------------- Module imports --------------------
import { prisma } from '../lib/prisma';

// -------------------- Util imports --------------------
import badRequest from '../utils/badRequest';
import notFound from '../utils/notFound';
import unauthorized from '../utils/unauthorized';

// -------------------- Member Role Enum --------------------
type MemberRole = 'OWNER' | 'MEMBER';

// -------------------- Helper functions --------------------

// Prevent a trip from losing its last owner.
// Returns true if the request must be stopped.
async function preventLastOwnerRemoval(
  res: Response,
  tripId: string,
  targetRole: MemberRole,
  willLoseOwnership: boolean,
): Promise<boolean> {
  if (targetRole !== 'OWNER' || !willLoseOwnership) {
    return false;
  }

  const ownerCount = await prisma.tripMember.count({
    where: { tripId, role: 'OWNER' },
  });

  if (ownerCount === 1) {
    badRequest(res, 'A trip must always have at least one owner');
    return true;
  }

  return false;
}

// -------------------- GET /api/trips/:tripId/members --------------------

/**
 * Every member associated with the provided trip
 */
export async function listMembers(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve the trip id from the req params -----
  const tripId = req.params.tripId;

  // ----- 3. Validate that the trip ID exists as a string -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip ID');
  }

  // ----- 4. Search for all members associated with the trip -----
  const members = await prisma.tripMember.findMany({
    where: { tripId },
    orderBy: { joinedAt: 'asc' },
    select: {
      id: true,
      userId: true,
      role: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  // ----- 5. Respond with members payload -----
  return res.json({ members });
}

// -------------------- GET /api/trips/:tripId/members/:userId --------------------

/**
 * One member with its full detail
 */
export async function getMemberById(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve both ids from the req params -----
  const tripId = req.params.tripId;
  const userId = req.params.userId;

  // ----- 3. Validate that both IDs exist as strings -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip ID');
  }

  if (typeof userId !== 'string') {
    return badRequest(res, 'Missing user ID');
  }

  // ----- 4. Search for the member record in the db using tripId and userId
  const member = await prisma.tripMember.findUnique({
    where: {
      tripId_userId: { tripId, userId },
    },
    select: {
      id: true,
      userId: true,
      role: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          email: true,
        },
      },
    },
  });

  // ----- 5. Missing OR out-of-trip member is a 404 -----
  if (!member) {
    return notFound(res, 'Member not found');
  }

  // ----- 6. Respond with formatted member data -----
  return res.json({ member });
}

// -------------------- PATCH /api/trips/:tripId/members/:userId --------------------
/**
 * Change the role of a trip member (OWNER usage only)
 */
export async function changeMemberRole(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve both ids from the req params -----
  const tripId = req.params.tripId;
  const userId = req.params.userId;

  // ----- 3. Validate that both IDs exist as strings -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip ID');
  }

  if (typeof userId !== 'string') {
    return badRequest(res, 'Missing user ID');
  }

  // ----- 4. Retrieve and validate role -----
  const role = req.body?.role;

  if (role !== 'OWNER' && role !== 'MEMBER') {
    return badRequest(res, 'Role must be OWNER or MEMBER');
  }

  // ----- 5. Retrieve role for target member -----
  const target = await prisma.tripMember.findUnique({
    where: {
      tripId_userId: { tripId, userId },
    },
    select: { role: true },
  });

  // ----- 6. Handle case where target member is not found -----
  if (!target) {
    return notFound(res, 'Member not found');
  }

  // ----- 7. Check if the target member is losing ownership -----
  const losingOwnership = target.role === 'OWNER' && role === 'MEMBER';

  // ----- 8. Prevent removal of last trip owner -----
  if (await preventLastOwnerRemoval(res, tripId, target.role, losingOwnership)) {
    return;
  }

  // ----- 9. Update the role of the target member -----
  const member = await prisma.tripMember.update({
    where: {
      tripId_userId: { tripId, userId },
    },
    data: { role },
    select: {
      id: true,
      userId: true,
      role: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  // ----- 10. Respond with updated member data -----
  return res.json({ member });
}

// -------------------- DELETE /api/trips/:tripId/members/me --------------------

/**
 * Leave trip option for requesting users (ANY MEMBER usage)
 */
export async function leaveTrip(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve trip id from req params -----
  const tripId = req.params.tripId;

  // ----- 3. Validate that the trip ID exists as a string -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip ID');
  }

  // ----- 4. Check that the requesting user is a member -----
  const membership = await prisma.tripMember.findUnique({
    where: {
      tripId_userId: {
        tripId,
        userId: req.user.id,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    return notFound(res, 'Member not found');
  }

  // ----- 5. Prevent the only trip OWNER from leaving the trip -----
  if (await preventLastOwnerRemoval(res, tripId, membership.role, true)) {
    return;
  }

  // ----- 6. Delete the trip member record associated with the requesting user -----
  await prisma.tripMember.delete({
    where: {
      tripId_userId: {
        tripId,
        userId: req.user.id,
      },
    },
  });

  // ----- 7. Respond with confirmation of leaving -----
  return res.json({ message: 'You have left the trip' });
}

// -------------------- DELETE /api/trips/:tripId/members/:userId --------------------

/**
 * Remove trip members option (OWNER usage only)
 */
export async function removeMember(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve both ids from the req params -----
  const tripId = req.params.tripId;
  const userId = req.params.userId;

  // ----- 3. Validate that both IDs exist as strings -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip ID');
  }

  if (typeof userId !== 'string') {
    return badRequest(res, 'Missing user ID');
  }

  // ----- 4. Make sure targeted member exists -----
  const target = await prisma.tripMember.findUnique({
    where: {
      tripId_userId: { tripId, userId },
    },
    select: { role: true },
  });

  if (!target) {
    return notFound(res, 'Member not found');
  }

  // ----- 5. Prevent last owner of trip from being removed -----
  if (await preventLastOwnerRemoval(res, tripId, target.role, true)) {
    return;
  }

  // ----- 6. Remove the target member from the trip -----
  await prisma.tripMember.delete({
    where: {
      tripId_userId: { tripId, userId },
    },
  });

  // ----- 7. Respond with member removal confirmation -----
  return res.json({ message: 'Member removed from the trip' });
}
