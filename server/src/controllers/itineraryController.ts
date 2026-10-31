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
import { groupEventsByDay } from '../utils/itineraryGrouping';

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

  // ----- 4. Retrieve the trip's itinerary events -----
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

  // ----- 5. Convert trip dates to YYYY-MM-DD -----
  const startDate = trip.startDate.toISOString().slice(0, 10);
  const endDate = trip.endDate.toISOString().slice(0, 10);

  // ----- 6. Group events into every day of the trip -----
  const days = groupEventsByDay(startDate, endDate, events);

  // ----- 7. Return the itinerary -----
  res.json({ days });
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
