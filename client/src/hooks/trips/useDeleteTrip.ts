/**
 * FILE: useDeleteTrip.ts
 * DESCRIPTION: Deletes a trip and clears it from the cache.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { tripKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { deleteTrip } from '../../services/tripService';

// -------------------- Hook --------------------
export function useDeleteTrip(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteTrip(tripId),

    onSuccess: () => {
      // removeQueries, NOT invalidateQueries. Invalidating would refetch a
      // trip that no longer exists and hand you a 404 on the way out.
      queryClient.removeQueries({ queryKey: tripKeys.detail(tripId) });
      void queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}
