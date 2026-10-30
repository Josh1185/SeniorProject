
/**
 * FILE: itineraryController.ts
 * DESCRIPTION: Endpoint controllers for the itinerary module.
 */

// -------------------- Type imports --------------------
import type { Request, Response } from 'express';

// -------------------- Module Imports --------------------
import { prisma } from '../lib/prisma';

// -------------------- Util imports --------------------
import badRequest from '../utils/badRequest';
import unauthorized from '../utils/unauthorized';
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

  // ----- 5. Convert trip dates to YYYY-MM-DD -----
  const startDate = trip.startDate.toISOString().slice(0, 10);
  const endDate = trip.endDate.toISOString().slice(0, 10);

  // ----- 6. Group events into every day of the trip -----
  const days = groupEventsByDay(startDate, endDate, events);

  // ----- 7. Return the itinerary -----
  res.json({ days });
}
