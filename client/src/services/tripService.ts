/**
 * FILE: tripService.ts
 * DESCRIPTION: Every network call the trip module makes, in one place.
 *
 *              THE LAYERING, which every feature module should copy:
 *
 *                services/  - talks to the API. No React, no hooks, no cache.
 *                             Just "given these arguments, call this endpoint
 *                             and return the response."
 *                hooks/     - wraps a service function in useQuery or
 *                             useMutation. Owns cache keys and invalidation.
 *                components - call hooks. Never call a service directly, and
 *                             never call `get`/`post` directly.
 *
 *              The payoff: these functions are plain async functions, so they
 *              can be unit tested or reused outside React without dragging in
 *              a QueryClient.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type {
  CreateTripBody,
  TripDetailResponse,
  TripListResponse,
  UpdateTripBody,
} from '../types/api';

// -------------------- Module and lib imports --------------------
import { del, get, patch, post } from '../lib/api';

// -------------------- List Filters --------------------

/**
 * Mirrors listTripsQuerySchema on the server. Keeping the shapes aligned by
 * hand is the cost of not generating a client - when the server's schema
 * changes, change this too.
 */
export interface TripFilters {
  search?: string;
  status?: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  role?: 'OWNER' | 'MEMBER';
  sort?: 'name' | 'startDate' | 'createdAt';
  order?: 'asc' | 'desc';
}

/**
 * Builds the query string, skipping anything empty.
 *
 * Sending `?search=` would be harmless (the server normalises it away) but
 * sending nothing keeps the URL readable in devtools, which matters more than
 * it sounds when you are debugging why a filter did not apply.
 */
function toQueryString(filters: TripFilters): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

// -------------------- Service Functions --------------------

/** GET /api/trips */
export function fetchTrips(filters: TripFilters = {}): Promise<TripListResponse> {
  return get<TripListResponse>(`/trips${toQueryString(filters)}`);
}

/** GET /api/trips/:tripId */
export function fetchTrip(tripId: string): Promise<TripDetailResponse> {
  return get<TripDetailResponse>(`/trips/${tripId}`);
}

/** POST /api/trips */
export function createTrip(body: CreateTripBody): Promise<TripDetailResponse> {
  return post<TripDetailResponse>('/trips', body);
}

/** PATCH /api/trips/:tripId */
export function updateTrip(tripId: string, body: UpdateTripBody): Promise<TripDetailResponse> {
  return patch<TripDetailResponse>(`/trips/${tripId}`, body);
}

/** DELETE /api/trips/:tripId - returns 204, so there is nothing to type. */
export function deleteTrip(tripId: string): Promise<void> {
  return del(`/trips/${tripId}`);
}
