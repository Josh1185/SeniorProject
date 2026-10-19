/**
 * FILE: activityController.ts
 * DESCRIPTION: Handles requests to list activities and view activity details
 *
 * LAST UPDATED: 2026-10-19 - File Created
 */

// -------------------- Imports --------------------
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { listActivitiesQuerySchema } from '../schemas/activitySchemas';
import unauthorized from '../utils/unauthorized';
import badRequest from '../utils/badRequest';
import notFound from '../utils/notFound';

// -------------------- List Activities --------------------
export async function listActivities(req: Request, res: Response) {
  // Make sure the request has an authenticated user.
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // Get the trip ID from the URL.
  const tripId = req.params.tripId;

  if (typeof tripId !== 'string' || !tripId) {
    return badRequest(res, 'Trip ID is required');
  }

  // Validate the search and sorting options.
  const query = listActivitiesQuerySchema.parse(req.query);

  // Retrieve activities from this trip, including each user's voting status.
  const activities = await prisma.activity.findMany({
    where: {
      tripId,
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
      createdAt: true,
      createdBy: {
        select: {
          id: true,
          displayName: true,
        },
      },
      _count: {
        select: {
          votes: true,
        },
      },
      votes: {
        where: { userId: req.user.id },
        select: { id: true },
      },
    },
    // Sort by vote count, name, or creation date.
    orderBy:
      query.sort === 'votes'
        ? { votes: { _count: query.order } }
        : query.sort === 'name'
          ? { name: query.order }
          : { createdAt: query.order },
  });
  // Include the vote count and whether the signed-in user voted.
  const payload = activities.map((activity) => {
    const { _count, votes, ...activityData } = activity;

    return {
      ...activityData,
      voteCount: _count.votes,
      hasVoted: votes.length > 0,
    };
  });

  res.json({ activities: payload });
}

// -------------------- Get Activity Details --------------------
export async function getActivityById(req: Request, res: Response) {
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  const tripId = req.params.tripId;
  const activityId = req.params.activityId;
  const userId = req.user.id;

  // Make sure both URL parameters are valid strings.
  if (typeof tripId !== 'string' || !tripId) {
    return badRequest(res, 'Trip ID is required');
  }

  if (typeof activityId !== 'string' || !activityId) {
    return badRequest(res, 'Activity ID is required');
  }
  // Find this activity only if it belongs to the requested trip.
  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      tripId,
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
      createdAt: true,
      createdBy: {
        select: {
          id: true,
          displayName: true,
        },
      },
      _count: {
        select: {
          votes: true,
        },
      },
      votes: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!activity) {
    return notFound(res, 'Activity not found');
  }
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
