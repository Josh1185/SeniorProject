/**
 * FILE: tripInvitationRoutes.ts
 * DESCRIPTION: The OWNER-facing half of the invitation module - sending,
 *              listing and revoking invitations for one trip.
 *
 *              Mounted UNDER the trip id, so it needs mergeParams:
 *
 *                app.use('/api/trips/:tripId/invitations',
 *                  requireAuth, requireTripRole('OWNER'), tripInvitationRouter);
 *
 *              The guard goes on the MOUNT rather than per route because all
 *              three are owner-only. That is the opposite of tripRoutes, where
 *              reading needs membership and writing needs ownership, so the
 *              guards differ per route.
 *
 *              The other half of this feature - accept, decline, and "my
 *              invitations" - cannot sit behind requireTripRole at all and
 *              lives in invitationRoutes.ts.
 *
 * LAST UPDATED: 2026-11-05 - File Created (Josh Iehle)
 */

// -------------------- Module Imports --------------------
import { Router } from 'express';

// -------------------- Controller Imports --------------------
import {
  createInvitation,
  listInvitations,
  revokeInvitation,
} from '../controllers/invitationController';

// -------------------- Router Instance --------------------
// mergeParams: true is REQUIRED. :tripId belongs to the mount path above, not
// to this router, so without it req.params.tripId is undefined in every handler.
export const tripInvitationRouter = Router({ mergeParams: true });

// -------------------- Collection Routes --------------------
tripInvitationRouter.get('/', listInvitations);
tripInvitationRouter.post('/', createInvitation);

// -------------------- Single Invitation Routes --------------------
tripInvitationRouter.delete('/:invitationId', revokeInvitation);
