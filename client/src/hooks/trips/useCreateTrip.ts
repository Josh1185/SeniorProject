/**
 * FILE: useCreateTrip.ts
 * DESCRIPTION: Creates a trip and refreshes the list.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { tripKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { createTrip } from '../../services/tripService';

// -------------------- Type imports --------------------
import type { CreateTripBody } from '../../types/api';

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTripBody) => createTrip(body),

    // Invalidating lists() rather than one specific list refreshes EVERY
    // cached filter combination, because lists() is a prefix of all of them.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}
