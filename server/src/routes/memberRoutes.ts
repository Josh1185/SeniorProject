/**
 * FILE: memberRoutes.ts
 * DESCRIPTION: The router for member module endpoints
 *
 * LAST UPDATED: 2026-10-25 - File Created (Yahya Nawaz)
 */

// -------------------- Module imports --------------------
import { Router } from 'express';

// -------------------- Controller imports --------------------
import {
  changeMemberRole,
  getMemberById,
  leaveTrip,
  listMembers,
  removeMember,
} from '../controllers/memberController';

// -------------------- Middleware imports --------------------
import { requireTripRole } from '../middleware/tripRole';

// -------------------- Router Instance --------------------
export const memberRouter = Router({ mergeParams: true });

// -------------------- Read Routes --------------------

// Read endpoints: any trip member
memberRouter.get('/', listMembers);
memberRouter.get('/:userId', getMemberById);

// -------------------- Change Role/Leave Trip Routes --------------------

// Role changes: owners only
memberRouter.patch('/:userId', requireTripRole('OWNER'), changeMemberRole);

// IMPORTANT: /me must come before /:userId.
memberRouter.delete('/me', leaveTrip);

memberRouter.delete('/:userId', requireTripRole('OWNER'), removeMember);
