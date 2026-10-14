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
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { TripFilters } from '../services/tripService';

// -------------------- Trip Module --------------------
export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters: TripFilters) => [...tripKeys.lists(), filters] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (tripId: string) => [...tripKeys.details(), tripId] as const,
};
