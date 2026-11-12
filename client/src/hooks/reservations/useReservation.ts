/**
 * FILE: useReservation.ts
 * DESCRIPTION: Fetches and caches a single reservation's details.
 *
 * LAST UPDATED: 2026-11-12 - File Created (Antony Benitez)
 */

// -------------------- Module imports --------------------

import { useQuery } from '@tanstack/react-query';

// -------------------- Service imports --------------------

import { fetchReservation } from '../../services/reservationService';

// -------------------- Query key imports --------------------

import { reservationKeys } from '../../lib/queryKeys';

// -------------------- Hook --------------------

/**
 * Retrieves full reservation details when the user selects a row.
 * The query stays disabled when no reservation is selected.
 */
export function useReservation(
  tripId: string | undefined,
  reservationId: string | undefined,
) {
  return useQuery({
    queryKey: reservationKeys.detail(
      tripId ?? '',
      reservationId ?? '',
    ),

    queryFn: () => fetchReservation(tripId!, reservationId!),

    enabled: Boolean(tripId && reservationId),
  });
}