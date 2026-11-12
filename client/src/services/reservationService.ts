/**
 * FILE: reservationService.ts
 * DESCRIPTION: API requests for the Reservations feature.
 *
 * LAST UPDATED: 2026-11-12 - Add reservation write functions (Antony Benitez)
 */

// -------------------- Type imports --------------------

import type {
  CreateReservationBody,
  ReservationDetailResponse,
  ReservationListResponse,
  ReservationType,
  UpdateReservationBody,
} from '../types/api';

// -------------------- Module and lib imports --------------------

import { del, get, patch, post } from '../lib/api';

// -------------------- List Filters --------------------

export interface ReservationFilters {
  search?: string;
  type?: ReservationType;
  sort?: 'name' | 'startDateTime' | 'createdAt';
  order?: 'asc' | 'desc';
}

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

// -------------------- Read Functions --------------------

/** GET /api/trips/:tripId/reservations */
export function fetchReservations(
  tripId: string,
  filters: ReservationFilters = {},
): Promise<ReservationListResponse> {
  return get<ReservationListResponse>(
    `/trips/${tripId}/reservations${toQueryString(filters)}`,
  );
}

/** GET /api/trips/:tripId/reservations/:reservationId */
export function fetchReservation(
  tripId: string,
  reservationId: string,
): Promise<ReservationDetailResponse> {
  return get<ReservationDetailResponse>(
    `/trips/${tripId}/reservations/${reservationId}`,
  );
}

// -------------------- Write Functions --------------------

/** POST /api/trips/:tripId/reservations */
export function createReservation(
  tripId: string,
  body: CreateReservationBody,
): Promise<ReservationDetailResponse> {
  return post<ReservationDetailResponse>(
    `/trips/${tripId}/reservations`,
    body,
  );
}

/** PATCH /api/trips/:tripId/reservations/:reservationId */
export function updateReservation(
  tripId: string,
  reservationId: string,
  body: UpdateReservationBody,
): Promise<ReservationDetailResponse> {
  return patch<ReservationDetailResponse>(
    `/trips/${tripId}/reservations/${reservationId}`,
    body,
  );
}

/** DELETE /api/trips/:tripId/reservations/:reservationId */
export function deleteReservation(
  tripId: string,
  reservationId: string,
): Promise<void> {
  return del(
    `/trips/${tripId}/reservations/${reservationId}`,
  );
}