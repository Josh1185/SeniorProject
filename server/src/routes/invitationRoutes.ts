/**
 * FILE: invitationRoutes.ts
 * DESCRIPTION: The INVITEE-facing half of the invitation module.
 *
 *              Mounted at the top level, NOT under a trip:
 *
 *                app.use('/api/invitations', requireAuth, invitationRouter);
 *
 *              requireAuth and nothing else. This is the one router in the
 *              codebase with no trip guard, and it is not an oversight:
 *
 *                - accept and decline are used by someone who is NOT a member
 *                  of the trip yet. requireTripRole() would 404 them before
 *                  the controller ran, which is the whole point of an
 *                  invitation.
 *                - "my invitations" has no :tripId to scope to. It answers
 *                  "what have I been invited to", which spans trips the caller
 *                  has no access to.
 *
 *              Every handler behind this router therefore does its own
 *              authorization. For the list it is the email filter; for accept
 *              and decline it is possession of the token.
 *
 *              NO mergeParams here - there is no parent path with params to
 *              merge, and :token belongs to this router.
 *
 * LAST UPDATED: 2026-11-05 - File Created (Josh Iehle)
 */

// -------------------- Module Imports --------------------
import { Router } from 'express';

// -------------------- Controller Imports --------------------
import {
  acceptInvitation,
  declineInvitation,
  listMyInvitations,
  getInvitationByToken,
} from '../controllers/invitationController';

// -------------------- Router Instance --------------------
export const invitationRouter = Router();

// -------------------- Collection Routes --------------------
invitationRouter.get('/', listMyInvitations);

// GET before the POSTs is not required - different methods never collide -
// but it keeps the read above the writes, as everywhere else.
invitationRouter.get('/:token', getInvitationByToken);

// -------------------- Token Routes --------------------
// POST rather than GET: both change state, and a GET that joins a trip would
// fire the moment a chat client previewed the link.
invitationRouter.post('/:token/accept', acceptInvitation);
invitationRouter.post('/:token/decline', declineInvitation);
