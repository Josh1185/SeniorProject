/**
 * FILE: reservationService.ts
 * DESCRIPTION: API requests for the Reservations feature.
 *
 * LAST UPDATED: 2026-11-04 - File Created (Antony Benitez)
 */

// -------------------- Type imports --------------------

import type {
  ReservationListResponse,
  ReservationType,
} from '../types/api';

// -------------------- Module and lib imports --------------------

import { get } from '../lib/api';

// -------------------- List Filters --------------------

/** Matches the server's reservation list query parameters. */
export interface ReservationFilters {
  search?: string;
  type?: ReservationType;
  sort?: 'name' | 'startDateTime' | 'createdAt';
  order?: 'asc' | 'desc';
}

/** Builds a query string, leaving out empty filters. */
function toQueryString(filters: ReservationFilters): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query ? `?${query}` : '';
}

// -------------------- Service Functions --------------------

/** GET /api/trips/:tripId/reservations */
export function fetchReservations(
  tripId: string,
  filters: ReservationFilters = {},
): Promise<ReservationListResponse> {
  return get<ReservationListResponse>(
    `/trips/${tripId}/reservations${toQueryString(filters)}`,
  );
}
