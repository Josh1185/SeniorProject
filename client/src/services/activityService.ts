/**
 * FILE: activityService.ts
 * DESCRIPTION: API requests for the Activities feature.
 *
 * LAST UPDATED: 2026-11-03 - File Created (Brandon Douglass)
 */

// -------------------- Type imports --------------------
import type { ActivityListResponse } from '../types/api';

// -------------------- Module and lib imports --------------------
import { get } from '../lib/api';

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
