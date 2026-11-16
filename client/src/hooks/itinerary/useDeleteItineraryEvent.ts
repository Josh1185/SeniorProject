/**
 * FILE: useDeleteItineraryEvent.ts
 * DESCRIPTION: Deletes an itinerary event and clears its cached data.
 */

// -------------------- Module imports --------------------

import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------

import { itineraryKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------

import { deleteItineraryEvent } from '../../services/itineraryService';

// -------------------- Hook --------------------

export function useDeleteItineraryEvent(
  tripId: string,
  itineraryEventId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteItineraryEvent(tripId, itineraryEventId),

    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: itineraryKeys.detail(tripId, itineraryEventId),
      });

      void queryClient.invalidateQueries({
        queryKey: itineraryKeys.lists(tripId),
      });
    },
  });
}
