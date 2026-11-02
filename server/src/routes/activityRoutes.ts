/**
 * FILE: activityRoutes.ts
 * DESCRIPTION: Defines routes for listing, viewing, creating, updating, and deleting trip activities.
 *
 * LAST UPDATED: 2026-10-30 - Add POST, PATCH, and DELETE activity routes (Brandon Douglass)
 *               2026-10-24 - Code Review Refactor (Josh Iehle)
 *               2026-10-19 - File Created (Brandon Douglass)
 */

// -------------------- Module Imports --------------------
import { Router } from 'express';

// -------------------- Controller Imports --------------------
import {
  listActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../controllers/activityController';

// -------------------- Router Instance --------------------
export const activityRouter = Router({ mergeParams: true });

// -------------------- Collection Routes --------------------
activityRouter.get('/', listActivities);
activityRouter.post('/', createActivity);

// -------------------- Single Activity Routes --------------------
activityRouter.get('/:activityId', getActivityById);
activityRouter.patch('/:activityId', updateActivity);
activityRouter.delete('/:activityId', deleteActivity);
