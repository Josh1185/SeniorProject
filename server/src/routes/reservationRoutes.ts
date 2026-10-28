/**
 * FILE: reservationRoutes.ts
 * DESCRIPTION: API routes for the reservation module.
 */

// -------------------- Module Imports --------------------
import { Router } from 'express';

// -------------------- Controller Imports --------------------
import {
  listReservations,
  getReservationById,
} from '../controllers/reservationController';

// -------------------- Router --------------------
export const reservationRouter = Router({ mergeParams: true });

// -------------------- GET Routes --------------------
reservationRouter.get('/', listReservations);
reservationRouter.get('/:reservationId', getReservationById);