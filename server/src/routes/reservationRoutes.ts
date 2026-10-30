/**
 * FILE: reservationRoutes.ts
 * DESCRIPTION: API routes for the reservation module.
 *
 * LAST UPDATED: 2026-10-28 - File Created (Antony Benitez)
 */

// -------------------- Module Imports --------------------
import { Router } from 'express';

// -------------------- Controller Imports --------------------
import { listReservations, getReservationById } from '../controllers/reservationController';

// -------------------- Router Instance --------------------
export const reservationRouter = Router({ mergeParams: true });

// -------------------- GET Routes --------------------
reservationRouter.get('/', listReservations);
reservationRouter.get('/:reservationId', getReservationById);
