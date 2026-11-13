/**
 * FILE: queryKeys.ts
 * DESCRIPTION: Query key factories for React Query.
 *
 * LAST UPDATED: 2026-11-06 - Add activity detail query keys (Brandon Douglass)
 *               2026-11-04 - Add reservation query keys (Antony Benitez)
 *               2026-11-03 - Add activity query keys (Brandon Douglass)
 *               2026-11-02 - Add expense query keys (Josh Iehle)
 *               2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------

import type { TripFilters } from '../services/tripService';
import type { ExpenseFilters } from '../services/expenseService';
import type { ActivityFilters } from '../services/activityService';
import type { ReservationFilters } from '../services/reservationService';

// -------------------- Trip Module --------------------

export const tripKeys = {
  all: ['trips'] as const,

  lists: () => [...tripKeys.all, 'list'] as const,

  list: (filters: TripFilters) => [...tripKeys.lists(), filters] as const,

  details: () => [...tripKeys.all, 'detail'] as const,

  detail: (tripId: string) => [...tripKeys.details(), tripId] as const,
};

// -------------------- Expense Module --------------------

export const expenseKeys = {
  all: (tripId: string) => ['trips', tripId, 'expenses'] as const,

  lists: (tripId: string) => [...expenseKeys.all(tripId), 'list'] as const,

  list: (tripId: string, filters: ExpenseFilters) =>
    [...expenseKeys.lists(tripId), filters] as const,

  details: (tripId: string) => [...expenseKeys.all(tripId), 'detail'] as const,

  detail: (tripId: string, expenseId: string) =>
    [...expenseKeys.details(tripId), expenseId] as const,
};

// -------------------- Activity Module --------------------

export const activityKeys = {
  all: (tripId: string) => ['trips', tripId, 'activities'] as const,

  lists: (tripId: string) => [...activityKeys.all(tripId), 'list'] as const,

  list: (tripId: string, filters: ActivityFilters) =>
    [...activityKeys.lists(tripId), filters] as const,

  // Groups all individual activity detail queries for this trip.
  details: (tripId: string) => [...activityKeys.all(tripId), 'detail'] as const,

  // Identifies the cached details for one specific activity.
  detail: (tripId: string, activityId: string) =>
    [...activityKeys.details(tripId), activityId] as const,
};

// -------------------- Reservation Module --------------------

export const reservationKeys = {
  all: (tripId: string) => ['trips', tripId, 'reservations'] as const,

  lists: (tripId: string) => [...reservationKeys.all(tripId), 'list'] as const,

  list: (tripId: string, filters: ReservationFilters) =>
    [...reservationKeys.lists(tripId), filters] as const,

  details: (tripId: string) => [...reservationKeys.all(tripId), 'detail'] as const,

  detail: (tripId: string, reservationId: string) =>
    [...reservationKeys.details(tripId), reservationId] as const,
};

// -------------------- Itinerary Module --------------------

export const itineraryKeys = {
  all: (tripId: string) =>
    ['trips', tripId, 'itinerary'] as const,

  lists: (tripId: string) =>
    [...itineraryKeys.all(tripId), 'list'] as const,

  list: (tripId: string) =>
    [...itineraryKeys.lists(tripId)] as const,

  details: (tripId: string) =>
    [...itineraryKeys.all(tripId), 'detail'] as const,

  detail: (tripId: string, itineraryEventId: string) =>
    [...itineraryKeys.details(tripId), itineraryEventId] as const,
};
