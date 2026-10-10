/**
 * FILE: tripController.ts
 * DESCRIPTION: Endpoint controllers for the trip module.
 *
 *              THIS IS THE REFERENCE IMPLEMENTATION. Every feature module
 *              copies this shape: validate with a Zod schema, check the caller,
 *              query with an explicit `select`, shape the response, return a
 *              consistent envelope.
 *
 *              Read this before writing activityController, reservationController,
 *              itineraryController or invitationController.
 *
 * LAST UPDATED: 2026-10-09 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { Request, Response } from 'express';

// -------------------- Module Imports --------------------
import { prisma } from '../lib/prisma';
import { createTripSchema, updateTripSchema } from '../schemas/tripSchemas';

// -------------------- Util imports --------------------
import badRequest from '../utils/badRequest';
import unauthorized from '../utils/unauthorized';
import { deriveTripStatus } from '../utils/tripStatus';

// -------------------- Internal Helpers --------------------

/**
 * Converts a YYYY-MM-DD string into the Date a @db.Date column expects.
 *
 * `new Date('2026-06-12')` is parsed as UTC midnight by the spec, which is
 * exactly right here. `new Date(2026, 5, 12)` would use LOCAL midnight and
 * shift the stored day for anyone west of Greenwich.
 */
function toDateOnly(isoDate: string): Date {
  return new Date(isoDate);
}

// -------------------- GET /api/trips --------------------

/**
 * Every trip the caller is a member of.
 *
 * No requireTripRole here: this route is not scoped to one trip, so membership
 * IS the filter. The `where` clause is what enforces authorization.
 */
export async function listTrips(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  const userId = req.user.id;

  // ----- 2. Search for all trips the user is a member of -----
  const trips = await prisma.trip.findMany({
    // "trips where at least one member row belongs to me"
    where: { members: { some: { userId } } },
    orderBy: { startDate: 'asc' },

    // Always use an explicit `select`. Returning whole rows leaks columns you
    // did not think about and silently grows the payload when the schema changes.
    select: {
      id: true,
      name: true,
      destination: true,
      startDate: true,
      endDate: true,

      // A nested filtered relation: fetches only THIS user's membership row,
      // so we get their role without a second query
      members: {
        where: { userId },
        select: { role: true },
      },

      // Prisma's aggregate helper. One query, no N+1
      _count: { select: { members: true } },
    },
  });

  // ----- 3. Flatten the query shape into the response shape -----
  // The client should not have to know that `yourRole` arrived as a one-element array
  const payload = trips.map(({ members, _count, ...trip }) => ({
    ...trip,
    status: deriveTripStatus(trip.startDate, trip.endDate),
    memberCount: _count.members,

    // The `where` clause above guarantees a membership row exists, but
    // noUncheckedIndexedAccess types members[0] as possibly undefined, and it
    // is right to make us say what happens if it is not there.
    yourRole: members[0]?.role ?? null,
  }));

  // ----- 4. Respond with formatted shape -----
  res.json({ trips: payload });
}

// -------------------- GET /api/trips/:tripId --------------------

/**
 * One trip with its full member roster.
 *
 * Mounted behind requireTripRole(), so by the time this runs the caller is
 * known to be a member and req.tripRole holds their role.
 */
export async function getTripById(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve the trip id from the req params -----
  const tripId = req.params.tripId;

  // ----- 3. Validate that the trip ID exists as a string -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 4. Search for the trip record in the db using tripId -----
  // findUniqueOrThrow is safe here: requireTripRole returned 404 if the caller
  // had no membership row, and a membership row cannot exist without its trip
  // (foreign key). If this throws, something is genuinely broken, and a 500 is
  // the honest answer.
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    select: {
      id: true,
      name: true,
      description: true,
      destination: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,

      createdBy: {
        select: { id: true, displayName: true, avatarUrl: true },
      },

      members: {
        orderBy: { joinedAt: 'asc' },
        select: {
          role: true,
          joinedAt: true,
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });

  // ----- 5. Respond with formatted trip data -----
  res.json({
    trip: {
      ...trip,
      status: deriveTripStatus(trip.startDate, trip.endDate),
    },
    // Saves the client a lookup through the member array to decide whether to
    // render owner-only controls.
    yourRole: req.tripRole,
  });
}

// -------------------- POST /api/trips --------------------

/**
 * Creates a trip and makes the creator its OWNER.
 *
 * The nested `members: { create: ... }` is the important part. Prisma wraps a
 * nested write and its parent in a single transaction, so there is no window
 * in which a trip exists without an owner. Two separate calls could leave an
 * ownerless trip behind if the second one failed, and nobody could then
 * administer or delete it.
 */
export async function createTrip(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Validate and retrieve request body -----
  // Throws a ZodError on invalid input, which the error middleware turns into a 422.
  const body = createTripSchema.parse(req.body);

  // ----- 3. Create trip in db with provided data -----
  const trip = await prisma.trip.create({
    data: {
      name: body.name,
      description: body.description,
      destination: body.destination,
      startDate: toDateOnly(body.startDate),
      endDate: toDateOnly(body.endDate),
      createdById: req.user.id,

      // Atomic with the trip insert. This ensures that the trip is created with an owner
      members: {
        create: { userId: req.user.id, role: 'OWNER' },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      destination: true,
      startDate: true,
      endDate: true,
      createdAt: true,
    }
  });

  // ----- 4. Respond with 201 and the created trip -----
  res.status(201).json({
    trip: {
      ...trip,
      status: deriveTripStatus(trip.startDate, trip.endDate),
    }
  });
}

// -------------------- PATCH /api/trips/:tripId --------------------

/**
 * Partial update. Mounted behind requireTripRole('OWNER').
 *
 * PATCH, never PUT: every field is optional and omitted fields are left alone.
 * PUT would mean "replace the whole resource", so omitting a field would blank it.
 */
export async function updateTrip(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve the trip id from the req params -----
  const tripId = req.params.tripId;

  // ----- 3. Validate that the trip ID exists as a string -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 4. Validate and retrieve request body -----
  // Throws a ZodError on invalid input, which the error middleware turns into a 422.
  const body = updateTripSchema.parse(req.body);

  // ----- 5. Validate start and end dates -----
  // The schema can only compare two dates it was given. If the request changes
  // just one of them, the other is whatever is already stored, so the ordering
  // rule has to be re-checked against the merged result.
  if (body.startDate !== undefined || body.endDate !== undefined) {
    const current = await prisma.trip.findUniqueOrThrow({
      where: { id: tripId },
      select: { startDate: true, endDate: true },
    });

    // toISOString().slice(0, 10) gives YYYY-MM-DD, comparable as a string
    // against the incoming values.
    const nextStart = body.startDate ?? current.startDate.toISOString().slice(0, 10);
    const nextEnd = body.endDate ?? current.endDate.toISOString().slice(0, 10);

    if (nextEnd < nextStart) {
      return badRequest(res, 'End date must be on or after the start date');
    }
  }

  // ----- 6. Update the trip record -----
  const trip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      name: body.name,
      description: body.description,
      destination: body.destination,
      startDate: body.startDate ? toDateOnly(body.startDate) : undefined,
      endDate: body.endDate ? toDateOnly(body.endDate) : undefined,
    },
    select: {
      id: true,
      name: true,
      description: true,
      destination: true,
      startDate: true,
      endDate: true,
      updatedAt: true,
    },
  });

  // ----- 7. Respond with the updated trip -----
  res.json({
    trip: {
      ...trip,
      status: deriveTripStatus(trip.startDate, trip.endDate),
    },
  });
}

// -------------------- DELETE /api/trips/:tripId --------------------

/**
 * Deletes a trip. Mounted behind requireTripRole('OWNER').
 *
 * Every child table cascades from Trip (members, activities, reservations,
 * itinerary events, expenses, comments, attachments, invitations), so this one
 * statement removes the whole workspace. That is intended, and it is why the
 * route is owner-only.
 */
export async function deleteTrip(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve the trip id from the req params -----
  const tripId = req.params.tripId;

  // ----- 3. Validate that the trip ID exists as a string -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 4. Delete the trip record -----
  await prisma.trip.delete({
    where: { id: tripId },
  });

  // ----- 5. Respond with a 204 -----
  // 204 means No Content: succeeded with nothing to send back
  res.status(204).end();
}
