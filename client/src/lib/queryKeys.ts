/**
 * FILE: queryKeys.ts
 * DESCRIPTION: Query key factories.
 *
 *              Hardcoding key arrays at each call site is how you get the
 *              "why didn't my list refresh after creating?" bug - one hook
 *              writes ['trips'] and another invalidates ['trip'], and nothing
 *              tells you they disagree.
 *
 *              The hierarchy matters. tripKeys.lists() is a PREFIX of every
 *              tripKeys.list(filters), so invalidating it refreshes every
 *              cached filter combination at once.
 *
 *              Each feature adds its own factory here.
 * LAST UPDATED: 2026-11-03 - Add activity query keys (Brandon Douglass)
 *               2026-11-02 - Add expense query keys (Josh Iehle)
 *               2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { TripFilters } from '../services/tripService';
import type { ExpenseFilters } from '../services/expenseService';
import type { ActivityFilters } from '../services/activityService';

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
  // All activity queries belonging to a trip.
  all: (tripId: string) => ['trips', tripId, 'activities'] as const,

  // All filtered activity lists for that trip.
  lists: (tripId: string) => [...activityKeys.all(tripId), 'list'] as const,

  // One list with its specific search and sorting filters.
  list: (tripId: string, filters: ActivityFilters) =>
    [...activityKeys.lists(tripId), filters] as const,
};
