/**
 * FILE: reservationRoutes.ts
 * DESCRIPTION: API routes for the reservation module.
 *
 * LAST UPDATED: 2026-10-30 - Add write API routes (Antony Benitez)
 *               2026-10-28 - File Created (Antony Benitez)
 */

// -------------------- Module Imports --------------------
import { Router } from 'express';

// -------------------- Controller Imports --------------------
import {
  listReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
} from '../controllers/reservationController';

// -------------------- Router Instance --------------------
export const reservationRouter = Router({ mergeParams: true });

// -------------------- GET Routes --------------------
reservationRouter.get('/', listReservations);
reservationRouter.get('/:reservationId', getReservationById);

// -------------------- Write Routes --------------------
reservationRouter.post('/', createReservation);
reservationRouter.patch('/:reservationId', updateReservation);
reservationRouter.delete('/:reservationId', deleteReservation);
