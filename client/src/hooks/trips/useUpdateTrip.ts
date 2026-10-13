/**
 * FILE: useUpdateTrip.ts
 * DESCRIPTION: Updates a trip and refreshes both the list and the detail.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { tripKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { updateTrip } from '../../services/tripService';

// -------------------- Type imports --------------------
import type { UpdateTripBody } from '../../types/api';

// -------------------- Hook --------------------
export function useUpdateTrip(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateTripBody) => updateTrip(tripId, body),

    // BOTH caches. Renaming a trip changes the detail page and the row in the
    // list; forgetting the second is why a rename sometimes looks like it did
    // not save until you refresh.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      void queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}
