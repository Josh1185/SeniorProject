/**
 * FILE: activityRoutes.ts
 * DESCRIPTION: Defines the routes for reading trip activities
 *
 * LAST UPDATED: 2026-10-24 - Code Review Refactor (Josh Iehle)
 *               2026-10-19 - File Created (Brandon Douglass)
 */

// -------------------- Module Imports --------------------
import { Router } from 'express';

// -------------------- Controller Imports --------------------
import { listActivities, getActivityById } from '../controllers/activityController';

// -------------------- Router Instance --------------------
export const activityRouter = Router({ mergeParams: true });

// -------------------- Collection Routes --------------------
activityRouter.get('/', listActivities);

// -------------------- Single Activity Routes --------------------
activityRouter.get('/:activityId', getActivityById);
