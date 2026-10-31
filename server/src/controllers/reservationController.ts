/**
 * FILE: reservationController.ts
 * DESCRIPTION: Endpoint controllers for the reservation module.
 *
 * LAST UPDATED: 2026-10-30 - Add create, update, and delete controllers (Antony Benitez)
 *               2026-10-28 - File Created (Antony Benitez)
 */

// -------------------- Type Imports --------------------
import type { Request, Response } from 'express';

// -------------------- Module Imports --------------------
import { prisma } from '../lib/prisma';

// -------------------- Schema Imports --------------------
import {
  listReservationsQuerySchema,
  createReservationSchema,
  updateReservationSchema,
  type ListReservationsQuery,
} from '../schemas/reservationSchemas';

// -------------------- Util Imports --------------------
import badRequest from '../utils/badRequest';
import notFound from '../utils/notFound';
import unauthorized from '../utils/unauthorized';

// -------------------- Shared Selects --------------------

/**
 * Fields returned when retrieving, creating, or updating a reservation.
 */
const reservationDetailSelect = {
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
} as const;

// -------------------- Internal Helpers --------------------

/**
 * Builds the Prisma orderBy object for a validated sorting option.
 */
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

/**
 * Converts a validated date string into a JavaScript Date for Prisma.
 *
 * Undefined means the field is not being changed.
 * Null means the field should be cleared.
 */
function toReservationDate(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return value;
  }

  return new Date(value);
}

// -------------------- GET /api/trips/:tripId/reservations --------------------

/**
 * Every reservation associated with the provided trip,
 * with optional search, filter, and sort.
 */
export async function listReservations(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that.
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve the trip ID from the request parameters -----
  const tripId = req.params.tripId;

  // ----- 3. Validate that the trip ID exists as a string -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 4. Validate the query string -----
  const query = listReservationsQuerySchema.parse(req.query);

  // ----- 5. Search for reservations belonging to this trip -----
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

  // ----- 6. Respond with reservation data -----
  res.json({ reservations });
}

// -------------------- GET /api/trips/:tripId/reservations/:reservationId --------------------

/**
 * Retrieves one reservation belonging to the current trip.
 */
export async function getReservationById(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve both IDs from the request parameters -----
  const tripId = req.params.tripId;
  const reservationId = req.params.reservationId;

  // ----- 3. Validate that both IDs exist as strings -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  if (typeof reservationId !== 'string') {
    return badRequest(res, 'Missing reservation id');
  }

  // ----- 4. Search for the reservation using BOTH IDs -----
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      tripId,
    },
    select: reservationDetailSelect,
  });

  // ----- 5. Missing or out-of-trip reservation is a 404 -----
  if (!reservation) {
    return notFound(res, 'Reservation not found');
  }

  // ----- 6. Respond with reservation data -----
  res.json({ reservation });
}

// -------------------- POST /api/trips/:tripId/reservations --------------------

/**
 * Creates a new reservation for the current trip.
 *
 * The reservation is automatically associated with:
 * - The trip specified in the URL
 * - The authenticated user who created it
 */
export async function createReservation(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve the trip ID -----
  const tripId = req.params.tripId;

  // ----- 3. Validate that the trip ID exists as a string -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 4. Validate the request body -----
  // Invalid input becomes HTTP 422 through the existing error middleware.
  const body = createReservationSchema.parse(req.body);

  // ----- 5. Create the reservation in the database -----
  const reservation = await prisma.reservation.create({
    data: {
      tripId,
      createdById: req.user.id,
      type: body.type,
      name: body.name,
      confirmationNumber: body.confirmationNumber,
      startDateTime: toReservationDate(body.startDateTime),
      endDateTime: toReservationDate(body.endDateTime),
      locationName: body.locationName,
      locationAddress: body.locationAddress,
      latitude: body.latitude,
      longitude: body.longitude,
      costCents: body.costCents,
      notes: body.notes,
    },
    select: reservationDetailSelect,
  });

  // ----- 6. Return the created reservation with HTTP 201 -----
  res.status(201).json({ reservation });
}

// -------------------- PATCH /api/trips/:tripId/reservations/:reservationId --------------------

/**
 * Partially updates a reservation belonging to the current trip.
 *
 * Only fields supplied in the request body are changed.
 * Omitted fields remain unchanged.
 */
export async function updateReservation(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve both IDs -----
  const tripId = req.params.tripId;
  const reservationId = req.params.reservationId;

  // ----- 3. Validate that both IDs exist as strings -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  if (typeof reservationId !== 'string') {
    return badRequest(res, 'Missing reservation id');
  }

  // ----- 4. Validate the request body -----
  const body = updateReservationSchema.parse(req.body);

  // ----- 5. Update the reservation within the current trip -----
  //
  // updateMany returns a count instead of throwing when nothing matches.
  // Including tripId prevents updates to another trip's reservations.
  const result = await prisma.reservation.updateMany({
    where: {
      id: reservationId,
      tripId,
    },
    data: {
      type: body.type,
      name: body.name,
      confirmationNumber: body.confirmationNumber,
      startDateTime: toReservationDate(body.startDateTime),
      endDateTime: toReservationDate(body.endDateTime),
      locationName: body.locationName,
      locationAddress: body.locationAddress,
      latitude: body.latitude,
      longitude: body.longitude,
      costCents: body.costCents,
      notes: body.notes,
    },
  });

  // ----- 6. Return 404 if the reservation was not found -----
  if (result.count === 0) {
    return notFound(res, 'Reservation not found');
  }

  // ----- 7. Retrieve the updated reservation -----
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      tripId,
    },
    select: reservationDetailSelect,
  });

  if (!reservation) {
    return notFound(res, 'Reservation not found');
  }

  // ----- 8. Respond with the updated reservation -----
  res.json({ reservation });
}

// -------------------- DELETE /api/trips/:tripId/reservations/:reservationId --------------------

/**
 * Deletes a reservation belonging to the current trip.
 *
 * Any member who passes requireTripRole() can delete a reservation,
 * following the same permission model as the Expenses module.
 */
export async function deleteReservation(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve both IDs -----
  const tripId = req.params.tripId;
  const reservationId = req.params.reservationId;

  // ----- 3. Validate that both IDs exist as strings -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  if (typeof reservationId !== 'string') {
    return badRequest(res, 'Missing reservation id');
  }

  // ----- 4. Delete the reservation belonging to this trip -----
  //
  // deleteMany returns a count instead of throwing when nothing matches.
  // Including tripId prevents deletion from another trip.
  const result = await prisma.reservation.deleteMany({
    where: {
      id: reservationId,
      tripId,
    },
  });

  // ----- 5. Return 404 when no reservation was deleted -----
  if (result.count === 0) {
    return notFound(res, 'Reservation not found');
  }

  // ----- 6. Return HTTP 204 No Content -----
  res.status(204).end();
}
