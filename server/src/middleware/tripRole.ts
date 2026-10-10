/**
 * FILE: tripRole.ts
 * DESCRIPTION: Trip-scoped authorization middleware
 *
 *              Mount it on any rooute whose path contains :tripId
 *
 * LAST UPDATED: 2026-10-09 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { NextFunction, Request, Response } from 'express';
import type { TripRole } from '../generated/prisma/enums';

// -------------------- Module imports --------------------
import { prisma } from '../lib/prisma';

// -------------------- Util imports --------------------
import forbidden from '../utils/forbidden';
import notFound from '../utils/notFound';
import unauthorized from '../utils/unauthorized';

// -------------------- Role Hierarchy --------------------

/**
 * Roles ranked by privilege. An OWNER can do anything a MEMBER can.
 *
 * Using a numeric rank rather than an equality check means adding a role later
 * (ORGANIZER, say) is a one-line change here instead of an edit to every
 * permission check in the app.
 */
const ROLE_RANK: Record<TripRole, number> = {
  MEMBER: 1,
  OWNER: 2,
};

// -------------------- requireTripRole Middleware --------------------

/**
 * Confirms the caller is a member of the trip in :tripId and holds at least
 * `minimumRole`. Attaches the resolved role to req.tripRole so route handlers
 * can make finer-grained decisions without a second database query.
 *
 * * USAGE - requireAuth MUST come first, it is what sets req.user:
 *
 * * app.use('/api/trips/:tripId/activities',
 * *   requireAuth,
 * *   requireTripRole(),
 * *   activityRouter
 * * );
 */
export function requireTripRole(minimumRole: TripRole = 'MEMBER') {
  return async (req: Request, res: Response, next: NextFunction) => {
    // ----- 1. Confirm requireAuth ran first -----
    // If this fires, the route is misconfigured, not the request.
    if (!req.user) {
      return unauthorized(res, 'Not signed in');
    }

    // ----- 2. Pull the trip id out of the route params -----
    // noUncheckedIndexedAccess makes this string | undefined, which is correct
    // because nothing guarantees this middleware was mounted on a path containing :tripId
    const tripId = req.params.tripId;
    if (typeof tripId !== 'string' || !tripId) {
      return notFound(res, 'Trip not found');
    }

    // ----- 3. Look up the caller's membership -----
    // One indexed query on the composite unique (tripId, userId)
    const membership = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: req.user.id } },
      select: { role: true },
    });

    // ----- 4. Non-members get 404, deliberately, NOT 403 -----
    // 403 would confirm the trip exists. Someone could then walk trip ids and
    // learn which ones are real. 404 is indistinguishable from a trip that was
    // never created, so a stranger learns nothing new either way.
    //
    // This also covers the case where the trip genuinely does not exist, which is the
    // same answer from the caller's point of view.
    if (!membership) {
      return notFound(res, 'Trip not found');
    }

    // ----- 5. Numbers with too low a rank get 403 -----
    // Here 403 IS correct: they already know the trip exists, because they are in it.
    // Telling them they lack permission leaks nothing new and is far more useful
    // than a confusing 404.
    if (ROLE_RANK[membership.role] < ROLE_RANK[minimumRole]) {
      return forbidden(res, `Requires ${minimumRole.toLowerCase()} access`);
    }

    // ----- 6. Hand off to the route -----
    req.tripRole = membership.role;
    next();
  };
}
