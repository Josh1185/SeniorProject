/**
 * FILE: itineraryController.ts
 * DESCRIPTION: Endpoint controllers for the itinerary module.
 *
 * LAST UPDATED: 2026-10-29 - File Created (Christopher Soliman)
 */

// -------------------- Type imports --------------------
import type { Request, Response } from 'express';

// -------------------- Module Imports --------------------
import { prisma } from '../lib/prisma';

// -------------------- Util imports --------------------
import badRequest from '../utils/badRequest';
import unauthorized from '../utils/unauthorized';
import notFound from '../utils/notFound';
import { isWithinTripDateRange } from '../utils/itineraryDateRange';


// -------------------- Schema imports --------------------
import {
  createItineraryEventSchema,
  updateItineraryEventSchema,
} from '../schemas/itinerarySchemas';

// -------------------- GET /api/trips/:tripId/itinerary --------------------

/**
 * Retrieves all itinerary events for a trip, grouped by calendar day.
 * Includes days with no scheduled events.
 *
 * Mounted behind requireAuth and requireTripRole().
 */

export async function getItinerary(req: Request, res: Response) {
  // ----- 1. Confirm the user is signed in -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve and validate the trip ID -----
  const tripId = req.params.tripId;

  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 3. Retrieve the trip's date range -----
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    select: {
      startDate: true,
      endDate: true,
    },
  });

  // ----- 4. Retrieve all itinerary events -----
  const events = await prisma.itineraryEvent.findMany({
    where: { tripId },
    orderBy: { startDateTime: 'asc' },
    select: {
      id: true,
      createdById: true,
      title: true,
      startDateTime: true,
      endDateTime: true,
      locationName: true,
      activityId: true,
      reservationId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // ----- 5. Return trip dates and events -----
  res.json({
    startDate: trip.startDate.toISOString().slice(0, 10),
    endDate: trip.endDate.toISOString().slice(0, 10),
    events,
  });
}


// -------------------- GET /api/trips/:tripId/itinerary/:itineraryEventId --------------------

/**
 * One itinerary event with its full detail
 */
export async function getItineraryEventById(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve both ids from the req params -----
  const tripId = req.params.tripId;
  const itineraryEventId = req.params.itineraryEventId;

  // ----- 3. Validate that both IDs exist as strings -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  if (typeof itineraryEventId !== 'string') {
    return badRequest(res, 'Missing itinerary event id');
  }

  // ----- 4. Search for the itinerary event record using BOTH ids -----
  const itineraryEvent = await prisma.itineraryEvent.findFirst({
    where: { id: itineraryEventId, tripId },
    select: {
      id: true,
      createdById: true,
      title: true,
      description: true,
      startDateTime: true,
      endDateTime: true,
      locationName: true,
      locationAddress: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // ----- 5. Missing OR out-of-trip itinerary event is a 404 -----
  if (!itineraryEvent) {
    return notFound(res, 'Itinerary event not found');
  }

  // ----- 6. Respond with formatted itinerary event data -----
  res.json({ itineraryEvent });
}

// -------------------- POST /api/trips/:tripId/itinerary --------------------
export async function createItineraryEvent(req: Request, res: Response) {
  // ----- 1. Confirm the user is signed in -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve and validate the trip ID -----
  const tripId = req.params.tripId;

  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }


  // ----- 3. Validate the request body -----
const body = createItineraryEventSchema.parse(req.body);

// ----- 4. Retrieve the trip's date range -----
const trip = await prisma.trip.findUniqueOrThrow({
  where: { id: tripId },
  select: {
    startDate: true,
    endDate: true,
  },
});

// ----- 5. Validate the event dates against the trip range -----
try {
  const startIsInRange = isWithinTripDateRange(
    new Date(body.startDateTime),
    body.timeZone,
    trip.startDate,
    trip.endDate,
  );

  const endIsInRange =
    body.endDateTime == null ||
    isWithinTripDateRange(
      new Date(body.endDateTime),
      body.timeZone,
      trip.startDate,
      trip.endDate,
    );

  if (!startIsInRange || !endIsInRange) {
    return badRequest(
      res,
      'Event dates must fall within the trip dates.',
    );
  }
} catch {
  return badRequest(res, 'A valid time zone is required.');
}

// ----- 6. Create the itinerary event -----


  const event = await prisma.itineraryEvent.create({
    data: {
      tripId,
      createdById: req.user.id,
      title: body.title,
      description: body.description,
      startDateTime: new Date(body.startDateTime),
      endDateTime:
        body.endDateTime == null
          ? body.endDateTime
          : new Date(body.endDateTime),
      locationName: body.locationName,
      locationAddress: body.locationAddress,
      latitude: body.latitude,
      longitude: body.longitude,
    },
    select: {
      id: true,
      tripId: true,
      createdById: true,
      title: true,
      description: true,
      startDateTime: true,
      endDateTime: true,
      locationName: true,
      locationAddress: true,
      latitude: true,
      longitude: true,
      activityId: true,
      reservationId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // ----- 7. Return 201 with the created event -----
  res.status(201).json({ event });
}

// -------------------- PATCH /api/trips/:tripId/itinerary/:eventId --------------------

/**
 * Updates an existing itinerary event belonging to a trip.
 *
 * Mounted behind requireAuth and requireTripRole().
 */

export async function updateItineraryEvent(req: Request, res: Response) {
  // ----- 1. Confirm the user is signed in -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve and validate the trip ID -----
  const tripId = req.params.tripId;

  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 3. Retrieve and validate the event ID -----
  const eventId = req.params.eventId;

  if (typeof eventId !== 'string') {
    return badRequest(res, 'Missing event id');
  }

  // ----- 4. Find the event belonging to this trip -----
  const existingEvent = await prisma.itineraryEvent.findFirstOrThrow({
    where: {
      id: eventId,
      tripId,
    },
    select: {
      startDateTime: true,
      endDateTime: true,
    },
  });

  // ----- 5. Retrieve the trip's date range -----
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    select: {
      startDate: true,
      endDate: true,
    },
  });

  // ----- 6. Validate the request body -----
  const body = updateItineraryEventSchema.parse(req.body);

  // ----- 7. Calculate the resulting start and end times -----
  const startDateTime =
    body.startDateTime === undefined
      ? existingEvent.startDateTime
      : new Date(body.startDateTime);

  const endDateTime =
    body.endDateTime === undefined
      ? existingEvent.endDateTime
      : body.endDateTime === null
        ? null
        : new Date(body.endDateTime);

  // ----- 8. Validate timestamp ordering -----
  if (endDateTime !== null && endDateTime < startDateTime) {
    return badRequest(
      res,
      'End date/time must be on or after the start date/time',
    );
  }

  // ----- 9. Validate the resulting dates against the trip range -----
  try {
    const startIsInRange = isWithinTripDateRange(
      startDateTime,
      body.timeZone,
      trip.startDate,
      trip.endDate,
    );

    const endIsInRange =
      endDateTime === null ||
      isWithinTripDateRange(
        endDateTime,
        body.timeZone,
        trip.startDate,
        trip.endDate,
      );

    if (!startIsInRange || !endIsInRange) {
      return badRequest(
        res,
        'Event dates must fall within the trip dates.',
      );
    }
  } catch {
    return badRequest(res, 'A valid time zone is required.');
  }

  // ----- 10. Update the itinerary event -----
  const event = await prisma.itineraryEvent.update({
    where: {
      id: eventId,
    },
    data: {
      title: body.title,
      description: body.description,
      startDateTime: body.startDateTime
        ? new Date(body.startDateTime)
        : undefined,
      endDateTime:
        body.endDateTime === undefined
          ? undefined
          : body.endDateTime === null
            ? null
            : new Date(body.endDateTime),
      locationName: body.locationName,
      locationAddress: body.locationAddress,
      latitude: body.latitude,
      longitude: body.longitude,
    },
    select: {
      id: true,
      tripId: true,
      createdById: true,
      title: true,
      description: true,
      startDateTime: true,
      endDateTime: true,
      locationName: true,
      locationAddress: true,
      latitude: true,
      longitude: true,
      activityId: true,
      reservationId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // ----- 11. Return the updated event -----
  res.json({ event });
}


// -------------------- DELETE /api/trips/:tripId/itinerary/:eventId --------------------

/**
 * Deletes an itinerary event belonging to a trip.
 *
 * Mounted behind requireAuth and requireTripRole().
 */
export async function deleteItineraryEvent(req: Request, res: Response) {
  // ----- 1. Confirm the user is signed in -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }
    // ----- 2. Retrieve and validate the trip ID -----
  const tripId = req.params.tripId;

  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 3. Retrieve and validate the event ID -----
  const eventId = req.params.eventId;

  if (typeof eventId !== 'string') {
    return badRequest(res, 'Missing event id');
  }

  // ----- 4. Verify the event belongs to this trip -----
  await prisma.itineraryEvent.findFirstOrThrow({
    where: {
      id: eventId,
      tripId,
    },
    select: {
      id: true,
    },
  });

  // ----- 5. Delete the itinerary event -----
  await prisma.itineraryEvent.delete({
    where: {
      id: eventId,
    },
  });

  // ----- 6. Return 204 No Content -----
  res.status(204).send();
}
