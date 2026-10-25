import { Router } from 'express';

import {
  changeMemberRole,
  getMemberById,
  leaveTrip,
  listMembers,
  removeMember,
} from '../controllers/memberController';
import { requireTripRole } from '../middleware/tripRole';

export const memberRouter = Router({ mergeParams: true });

// Read endpoints: any trip member
memberRouter.get('/', listMembers);
memberRouter.get('/:userId', getMemberById);

// Role changes: owners only
memberRouter.patch('/:userId', requireTripRole('OWNER'), changeMemberRole);

// IMPORTANT: /me must come before /:userId.
memberRouter.delete('/me', leaveTrip);

memberRouter.delete('/:userId', requireTripRole('OWNER'), removeMember);
