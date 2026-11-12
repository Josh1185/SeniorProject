/**
 * FILE: useUpdateReservation.ts
 * DESCRIPTION: Updates a reservation and refreshes its cached data.
 *
 * LAST UPDATED: 2026-11-12 - File Created (Antony Benitez)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { reservationKeys } from '../../lib/queryKeys';
import { updateReservation } from '../../services/reservationService';

import type { UpdateReservationBody } from '../../types/api';

export function useUpdateReservation(
  tripId: string,
  reservationId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateReservationBody) =>
      updateReservation(tripId, reservationId, body),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: reservationKeys.detail(tripId, reservationId),
      });

      void queryClient.invalidateQueries({
        queryKey: reservationKeys.lists(tripId),
      });
    },
  });
}