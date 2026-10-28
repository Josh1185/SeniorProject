/**
 * FILE: reservationController.ts
 * DESCRIPTION: Endpoint controllers for the reservation module.
 */

// -------------------- Type Imports --------------------
import type { Request, Response } from 'express';

// -------------------- Module Imports --------------------
import { prisma } from '../lib/prisma';
import { z } from 'zod';

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

// -------------------- GET Reservations --------------------

export async function listReservations(req: Request, res: Response) {
  // Check that the user is signed in
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // Get the trip ID from the URL
  const tripId = req.params.tripId;

  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // Validate search, type, and sorting parameters
  const query = listReservationsQuerySchema.parse(req.query);

  // Retrieve reservations belonging to the trip
  const reservations = await prisma.reservation.findMany({
    where: {
      tripId,

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

  // Return the reservations as JSON
  res.json({ reservations });
}

// -------------------- GET Single Reservation --------------------

export async function getReservationById(req: Request, res: Response) {
  // Check that the user is signed in
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // Get the trip ID and reservation ID from the URL
  const tripId = req.params.tripId;
  const reservationId = req.params.reservationId;

  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  if (typeof reservationId !== 'string') {
    return badRequest(res, 'Missing reservation id');
  }

  // Check that the reservation ID is a valid UUID
  if (!z.uuid().safeParse(reservationId).success) {
    return notFound(res, 'Reservation not found');
  }

  // Find the reservation belonging to this trip
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

  // Return 404 if the reservation was not found
  if (!reservation) {
    return notFound(res, 'Reservation not found');
  }

  // Return the reservation as JSON
  res.json({ reservation });
}
