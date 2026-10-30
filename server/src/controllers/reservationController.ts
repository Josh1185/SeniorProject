/**
 * FILE: reservationController.ts
 * DESCRIPTION: Endpoint controllers for the reservation module.
 *
 * LAST UPDATED: 2026-10-28 - File Created (Antony Benitez)
 */

// -------------------- Type Imports --------------------
import type { Request, Response } from 'express';

// -------------------- Module Imports --------------------
import { prisma } from '../lib/prisma';

// -------------------- Schema Imports --------------------
import {
  listReservationsQuerySchema,
  type ListReservationsQuery,
} from '../schemas/reservationSchemas';

// -------------------- Util Imports --------------------
import badRequest from '../utils/badRequest';
import notFound from '../utils/notFound';
import unauthorized from '../utils/unauthorized';

// -------------------- Internal Helpers --------------------

function buildReservationOrderBy(
  sort: ListReservationsQuery['sort'],
  order: ListReservationsQuery['order'],
) {
  switch (sort) {
    case 'name':
      return { name: order };
    case 'startDateTime':
      return { startDateTime: order };
    case 'createdAt':
      return { createdAt: order };
  }
}

// -------------------- GET /api/trips/:tripId/reservations --------------------

/**
 * Every reservation associated with the provided trip, with optional search, filter, and sort
 */
export async function listReservations(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 3. Retrieve the trip id from the req params -----
  const tripId = req.params.tripId;

  // ----- 3. Validate that the trip ID exists as a string -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 4. Validate the query string -----
  const query = listReservationsQuerySchema.parse(req.query);

  // ----- 5. Search for all reservations associated with the trip -----
  const reservations = await prisma.reservation.findMany({
    where: {
      tripId: tripId,

      // Filter reservations by type
      ...(query.type ? { type: query.type } : {}),

      // Search reservations by name
      ...(query.search
        ? {
            name: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    },

    select: {
      id: true,
      type: true,
      name: true,
      confirmationNumber: true,
      startDateTime: true,
      endDateTime: true,
      locationName: true,
      costCents: true,
    },

    orderBy: buildReservationOrderBy(query.sort, query.order),
  });

  // ----- 6. Respond with data -----
  res.json({ reservations });
}

// -------------------- GET /api/trips/:tripId/reservations/:reservationId --------------------

export async function getReservationById(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve both ids from the req params -----
  const tripId = req.params.tripId;
  const reservationId = req.params.reservationId;

  // ----- 3. Validate that both IDs exist as strings -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  if (typeof reservationId !== 'string') {
    return badRequest(res, 'Missing reservation id');
  }

  // ----- 4. Search for the reservation record using BOTH ids -----
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      tripId,
    },

    select: {
      id: true,
      type: true,
      name: true,
      confirmationNumber: true,
      startDateTime: true,
      endDateTime: true,
      locationName: true,
      locationAddress: true,
      latitude: true,
      longitude: true,
      costCents: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // ----- 5. Missing OR out-of-trip reservation is a 404 -----
  if (!reservation) {
    return notFound(res, 'Reservation not found');
  }

  // ----- 6. Respond with formatted reservation data -----
  res.json({ reservation });
}
