/**
 * FILE: activityService.ts
 * DESCRIPTION: API requests for the Activities feature.
 *
 * LAST UPDATED: 2026-11-12 - Add activity create, update, and delete API requests (Brandon Douglass)
 *               2026-11-06 - Add activity detail API request (Brandon Douglass)
 *               2026-11-03 - File Created (Brandon Douglass)
 */

// -------------------- Type imports --------------------
import type {
  ActivityListResponse,
  ActivityDetailResponse,
  CreateActivityBody,
  UpdateActivityBody,
} from '../types/api';

// -------------------- Module and lib imports --------------------
import { get, post, patch, del } from '../lib/api';
import { toISOStringFromLocal } from '../lib/format';

// -------------------- List Filters --------------------

/** Matches the server's listActivitiesQuerySchema. */
export interface ActivityFilters {
  search?: string;
  sort?: 'name' | 'votes' | 'createdAt';
  order?: 'asc' | 'desc';
}

/** Builds a query string, leaving out empty filters. */
function toQueryString(filters: ActivityFilters): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

// -------------------- Service Functions --------------------

/** GET /api/trips/:tripId/activities */
export function fetchActivities(
  tripId: string,
  filters: ActivityFilters = {},
): Promise<ActivityListResponse> {
  return get<ActivityListResponse>(`/trips/${tripId}/activities${toQueryString(filters)}`);
}

/**
 * Retrieves the full details of one activity within a trip.
 * The backend checks that the activity belongs to the requested trip.
 */
export function fetchActivity(tripId: string, activityId: string) {
  return get<ActivityDetailResponse>(`/trips/${tripId}/activities/${activityId}`);
}

/** POST /api/trips/:tripId/activities */
export function createActivity(tripId: string, body: CreateActivityBody) {
  return post(`/trips/${tripId}/activities`, {
    ...body,
    suggestedDateTime: body.suggestedDateTime ? toISOStringFromLocal(body.suggestedDateTime) : null,
  });
}

/** PATCH /api/trips/:tripId/activities/:activityId */
export function updateActivity(tripId: string, activityId: string, body: UpdateActivityBody) {
  return patch(`/trips/${tripId}/activities/${activityId}`, {
    ...body,
    ...(body.suggestedDateTime !== undefined && {
      suggestedDateTime: body.suggestedDateTime
        ? toISOStringFromLocal(body.suggestedDateTime)
        : null,
    }),
  });
}

/** DELETE /api/trips/:tripId/activities/:activityId */
export function deleteActivity(tripId: string, activityId: string): Promise<void> {
  return del(`/trips/${tripId}/activities/${activityId}`);
}
