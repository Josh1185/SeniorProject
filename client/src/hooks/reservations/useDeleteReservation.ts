/**
 * FILE: useDeleteReservation.ts
 * DESCRIPTION: Deletes a reservation and clears its cached details.
 *
 * LAST UPDATED: 2026-11-12 - File Created (Antony Benitez)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { reservationKeys } from '../../lib/queryKeys';
import { deleteReservation } from '../../services/reservationService';

export function useDeleteReservation(
  tripId: string,
  reservationId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteReservation(tripId, reservationId),

    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: reservationKeys.detail(tripId, reservationId),
      });

      void queryClient.invalidateQueries({
        queryKey: reservationKeys.lists(tripId),
      });
    },
  });
}