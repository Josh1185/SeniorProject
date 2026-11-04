/**
 * FILE: useReservations.ts
 * DESCRIPTION: Fetches and caches a trip's reservations using React Query.
 *
 * LAST UPDATED: 2026-11-04 - File Created (Antony Benitez)
 */

// -------------------- Module imports --------------------

import { useQuery, keepPreviousData } from '@tanstack/react-query';

// -------------------- Service imports --------------------

import { fetchReservations } from '../../services/reservationService';
import type { ReservationFilters } from '../../services/reservationService';

// -------------------- Query key imports --------------------

import { reservationKeys } from '../../lib/queryKeys';

// -------------------- Hook --------------------

/**
 * Retrieves reservations for a trip.
 * Supports search, type filtering, and sorting.
 */
export function useReservations(
  tripId: string | undefined,
  filters: ReservationFilters = {},
) {
  return useQuery({
    queryKey: reservationKeys.list(tripId ?? '', filters),

    queryFn: () => fetchReservations(tripId!, filters),

    enabled: Boolean(tripId),

    placeholderData: keepPreviousData,
  });
}
