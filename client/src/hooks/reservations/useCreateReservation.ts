/**
 * FILE: useCreateReservation.ts
 * DESCRIPTION: Creates a reservation and refreshes reservation lists.
 *
 * LAST UPDATED: 2026-11-12 - File Created (Antony Benitez)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { reservationKeys } from '../../lib/queryKeys';
import { createReservation } from '../../services/reservationService';

import type { CreateReservationBody } from '../../types/api';

export function useCreateReservation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateReservationBody) =>
      createReservation(tripId, body),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: reservationKeys.lists(tripId),
      });
    },
  });
}