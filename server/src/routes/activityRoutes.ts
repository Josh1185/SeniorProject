/**
 * FILE: activityRoutes.ts
 * DESCRIPTION: Defines the routes for reading trip activities
 *
 * LAST UPDATED: 2026-10-19 - File Created
 */

import { Router } from 'express';
import { listActivities, getActivityById } from '../controllers/activityController';

export const activityRouter = Router({ mergeParams: true });

activityRouter.get('/', listActivities);
activityRouter.get('/:activityId', getActivityById);
