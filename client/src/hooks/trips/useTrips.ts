/**
 * FILE: useTrips.ts
 * DESCRIPTION: The caller's trips, with optional filters.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { keepPreviousData, useQuery } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { tripKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { fetchTrips, type TripFilters } from '../../services/tripService';

// -------------------- Hook --------------------
export function useTrips(filters: TripFilters = {}) {
  return useQuery({
    queryKey: tripKeys.list(filters),
    queryFn: () => fetchTrips(filters),

    // Keeps the previous results on screen while a new filter loads, instead
    // of blanking the list and snapping back. Without this, changing a
    // dropdown makes the page flash empty for a moment.
    placeholderData: keepPreviousData,
  });
}
