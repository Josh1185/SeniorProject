/**
 * FILE: userRoutes.ts
 * DESCRIPTION: The router for user module endpoints
 *
 * LAST UPDATED: 2026-09-24 - File Created (Josh Iehle)
 */

// -------------------- Module Imports --------------------
import { Router } from 'express';

// -------------------- Controller Imports --------------------
import { getSignedInUserProfile } from '../controllers/userController';

// -------------------- Router Instance --------------------
export const userRouter = Router();

// -------------------- Routes --------------------
userRouter.get('/me', getSignedInUserProfile);
