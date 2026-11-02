/**
 * FILE: activityController.ts
 * DESCRIPTION: Handles requests to list, view, create, update, and delete activities.
 *
 * LAST UPDATED: 2026-10-30 - Add POST, PATCH, and DELETE activity controllers (Brandon Douglass)
 *               2026-10-24 - Code Review Refactor (Josh Iehle)
 *               2026-10-19 - File Created (Brandon Douglass)
 */

// -------------------- Type Imports --------------------
import type { Request, Response } from 'express';

// -------------------- Module imports --------------------
import { prisma } from '../lib/prisma';

// -------------------- Schema imports --------------------
import {
  createActivitySchema,
  updateActivitySchema,
  listActivitiesQuerySchema,
  type ListActivitiesQuery,
} from '../schemas/activitySchemas';

// -------------------- Util imports --------------------
import unauthorized from '../utils/unauthorized';
import badRequest from '../utils/badRequest';
import notFound from '../utils/notFound';

// -------------------- Internal Helpers --------------------

/**
 * Builds the Prisma `orderBy` for a validated sort option
 */
function buildActivityOrderBy(
  sort: ListActivitiesQuery['sort'],
  order: ListActivitiesQuery['order'],
) {
  switch (sort) {
    case 'name':
      return { name: order };
    case 'createdAt':
      return { createdAt: order };
    case 'votes':
      return { votes: { _count: order } };
  }
}

// -------------------- GET /api/trips/:tripId/activities --------------------

/**
 * Every activity associated with the provided trip, with optional search and sort
 */
export async function listActivities(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve the trip id from the req params -----
  const tripId = req.params.tripId;

  // ----- 3. Validate that the trip ID exists as a string -----
  if (typeof tripId !== 'string' || !tripId) {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 4. Validate the query string -----
  const query = listActivitiesQuerySchema.parse(req.query);

  // ----- 5. Retrieve activities from this trip, including each user's voting status -----
  const activities = await prisma.activity.findMany({
    where: {
      // Make sure the activites belong to the current trip
      tripId: tripId,

      // SEARCH. Case-insensitve substring for name
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
      name: true,
      locationName: true,
      estimatedCostCents: true,
      suggestedDateTime: true,

      // Audit fields
      createdAt: true,
      createdBy: {
        select: {
          id: true,
          displayName: true,
        },
      },

      // Retrieve vote count for the activity
      _count: {
        select: {
          votes: true,
        },
      },

      // Check to see if the requesting user voted for the activity
      votes: {
        where: { userId: req.user.id },
        select: { id: true },
      },
    },
    // Sort by vote count, name, or creation date.
    orderBy: buildActivityOrderBy(query.sort, query.order),
  });

  // ----- 6. Flatten the query shape into the response shape -----
  const payload = activities.map(({ _count, votes, ...activity }) => ({
    ...activity,
    voteLength: _count.votes,
    hasVoted: votes.length > 0,
  }));

  // ----- 7. Respond with formatted shape -----
  res.json({ activities: payload });
}

// -------------------- GET /api/trips/:tripId/activities/:activityId --------------------

/**
 * One activity with its full detail
 */
export async function getActivityById(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve ids from the req params -----
  const tripId = req.params.tripId;
  const activityId = req.params.activityId;
  const userId = req.user.id;

  // ----- 3. Validate that both IDs exist as strings -----
  if (typeof tripId !== 'string' || !tripId) {
    return badRequest(res, 'Trip ID is required');
  }

  if (typeof activityId !== 'string' || !activityId) {
    return badRequest(res, 'Activity ID is required');
  }

  // ----- 4. Search for the activity record in the db using activityId and tripId -----
  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      tripId: tripId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      suggestedDateTime: true,
      locationName: true,
      locationAddress: true,
      latitude: true,
      longitude: true,
      estimatedCostCents: true,

      // Audit fields
      createdAt: true,
      createdBy: {
        select: {
          id: true,
          displayName: true,
        },
      },

      // Vote Count
      _count: {
        select: {
          votes: true,
        },
      },

      // Check to see if the requesting user voted for the activity
      votes: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  // ----- 5. Missing OR out-of-trip activity is a 404 -----
  if (!activity) {
    return notFound(res, 'Activity not found');
  }

  // ----- 6. Respond with formatted activity data -----

  // Convert the vote data into fields the frontend can use.
  const { _count, votes, ...activityData } = activity;

  res.json({
    activity: {
      ...activityData,
      voteCount: _count.votes,
      hasVoted: votes.length > 0,
    },
  });
}

// -------------------- POST /api/trips/:tripId/activities --------------------

/**
 * Creates an activity for a trip.
 * Any authenticated trip member can create an activity.
 */
export async function createActivity(req: Request, res: Response) {
  // ----- 1. Check that the user is authenticated -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve and validate the trip ID -----
  const tripId = req.params.tripId;

  if (typeof tripId !== 'string' || !tripId) {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 3. Validate the request body using Zod -----
  // Invalid input throws a ZodError, handled as HTTP 422.
  const body = createActivitySchema.parse(req.body);

  // ----- 4. Create the activity in the database -----
  const activity = await prisma.activity.create({
    data: {
      tripId,
      createdById: req.user.id,
      name: body.name,
      description: body.description,
      locationName: body.locationName,
      locationAddress: body.locationAddress,
      latitude: body.latitude,
      longitude: body.longitude,
      estimatedCostCents: body.estimatedCostCents,
    },
    select: {
      id: true,
      name: true,
      description: true,
      locationName: true,
      locationAddress: true,
      latitude: true,
      longitude: true,
      estimatedCostCents: true,
      createdAt: true,
    },
  });

  // ----- 5. Return HTTP 201 with the created activity -----
  res.status(201).json({ activity });
}

// -------------------- PATCH /api/trips/:tripId/activities/:activityId --------------------

/**
 * Updates an existing activity.
 * Any authenticated trip member can update activities.
 */
export async function updateActivity(req: Request, res: Response) {
  // ----- 1. Check that the user is authenticated -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve the trip and activity IDs -----
  const tripId = req.params.tripId;
  const activityId = req.params.activityId;

  // ----- 3. Validate both IDs -----
  if (typeof tripId !== 'string' || !tripId) {
    return badRequest(res, 'Missing trip id');
  }

  if (typeof activityId !== 'string' || !activityId) {
    return badRequest(res, 'Missing activity id');
  }

  // ----- 4. Validate the request body using Zod -----
  // Invalid data throws a ZodError, handled as HTTP 422.
  const body = updateActivitySchema.parse(req.body);

  // ----- 5. Check that the activity belongs to this trip -----
  const existingActivity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      tripId,
    },
    select: { id: true },
  });

  if (!existingActivity) {
    return notFound(res, 'Activity not found');
  }

  // ----- 6. Update the activity -----
  const activity = await prisma.activity.update({
    where: {
      id: activityId,
      tripId,
    },
    data: {
      name: body.name,
      description: body.description,
      locationName: body.locationName,
      locationAddress: body.locationAddress,
      latitude: body.latitude,
      longitude: body.longitude,
      estimatedCostCents: body.estimatedCostCents,
    },
    select: {
      id: true,
      name: true,
      description: true,
      locationName: true,
      locationAddress: true,
      latitude: true,
      longitude: true,
      estimatedCostCents: true,
      updatedAt: true,
    },
  });

  // ----- 7. Respond with HTTP 200 -----
  res.status(200).json({ activity });
}

// -------------------- DELETE /api/trips/:tripId/activities/:activityId --------------------

/**
 * Deletes an activity from a trip.
 * Any authenticated trip member can delete activities.
 */
export async function deleteActivity(req: Request, res: Response) {
  // ----- 1. Check that the user is authenticated -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve the trip and activity IDs -----
  const tripId = req.params.tripId;
  const activityId = req.params.activityId;

  // ----- 3. Validate both IDs -----
  if (typeof tripId !== 'string' || !tripId) {
    return badRequest(res, 'Missing trip id');
  }

  if (typeof activityId !== 'string' || !activityId) {
    return badRequest(res, 'Missing activity id');
  }

  // ----- 4. Check that the activity belongs to this trip -----
  const existingActivity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      tripId,
    },
    select: { id: true },
  });

  if (!existingActivity) {
    return notFound(res, 'Activity not found');
  }

  // ----- 5. Delete the activity -----
  await prisma.activity.delete({
    where: {
      id: activityId,
      tripId,
    },
  });

  // ----- 6. Respond with HTTP 204 (No Content) -----
  res.status(204).end();
}
