import type { Request, Response } from 'express';

import { prisma } from '../lib/prisma';
import badRequest from '../utils/badRequest';
import notFound from '../utils/notFound';
import unauthorized from '../utils/unauthorized';

type MemberRole = 'OWNER' | 'MEMBER';

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

// GET /api/trips/:tripId/members
export async function listMembers(req: Request, res: Response) {
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  const tripId = req.params.tripId;

  if (typeof tripId !== 'string' || !tripId) {
    return badRequest(res, 'Trip ID is required');
  }

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

  return res.json({ members });
}

// GET /api/trips/:tripId/members/:userId
export async function getMemberById(req: Request, res: Response) {
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  const tripId = req.params.tripId;
  const userId = req.params.userId;

  if (typeof tripId !== 'string' || !tripId) {
    return badRequest(res, 'Trip ID is required');
  }

  if (typeof userId !== 'string' || !userId) {
    return badRequest(res, 'User ID is required');
  }

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
        },
      },
    },
  });

  if (!member) {
    return notFound(res, 'Member not found');
  }

  return res.json({ member });
}

// PATCH /api/trips/:tripId/members/:userId
export async function changeMemberRole(req: Request, res: Response) {
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  const tripId = req.params.tripId;
  const userId = req.params.userId;

  if (typeof tripId !== 'string' || !tripId) {
    return badRequest(res, 'Trip ID is required');
  }

  if (typeof userId !== 'string' || !userId) {
    return badRequest(res, 'User ID is required');
  }

  const role = req.body?.role;

  if (role !== 'OWNER' && role !== 'MEMBER') {
    return badRequest(res, 'Role must be OWNER or MEMBER');
  }

  const target = await prisma.tripMember.findUnique({
    where: {
      tripId_userId: { tripId, userId },
    },
    select: { role: true },
  });

  if (!target) {
    return notFound(res, 'Member not found');
  }

  const losingOwnership = target.role === 'OWNER' && role === 'MEMBER';

  if (await preventLastOwnerRemoval(res, tripId, target.role, losingOwnership)) {
    return;
  }

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

  return res.json({ member });
}

// DELETE /api/trips/:tripId/members/me
export async function leaveTrip(req: Request, res: Response) {
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  const tripId = req.params.tripId;

  if (typeof tripId !== 'string' || !tripId) {
    return badRequest(res, 'Trip ID is required');
  }

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

  if (await preventLastOwnerRemoval(res, tripId, membership.role, true)) {
    return;
  }

  await prisma.tripMember.delete({
    where: {
      tripId_userId: {
        tripId,
        userId: req.user.id,
      },
    },
  });

  return res.json({ message: 'You have left the trip' });
}

// DELETE /api/trips/:tripId/members/:userId
export async function removeMember(req: Request, res: Response) {
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  const tripId = req.params.tripId;
  const userId = req.params.userId;

  if (typeof tripId !== 'string' || !tripId) {
    return badRequest(res, 'Trip ID is required');
  }

  if (typeof userId !== 'string' || !userId) {
    return badRequest(res, 'User ID is required');
  }

  const target = await prisma.tripMember.findUnique({
    where: {
      tripId_userId: { tripId, userId },
    },
    select: { role: true },
  });

  if (!target) {
    return notFound(res, 'Member not found');
  }

  if (await preventLastOwnerRemoval(res, tripId, target.role, true)) {
    return;
  }

  await prisma.tripMember.delete({
    where: {
      tripId_userId: { tripId, userId },
    },
  });

  return res.json({ message: 'Member removed from the trip' });
}
