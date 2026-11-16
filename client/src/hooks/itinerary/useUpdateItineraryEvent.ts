/**
 * FILE: useUpdateItineraryEvent.ts
 * DESCRIPTION: Updates an itinerary event and refreshes its cached data.
 */

// -------------------- Module imports --------------------

import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------

import { itineraryKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------

import { updateItineraryEvent } from '../../services/itineraryService';

// -------------------- Type imports --------------------

import type { UpdateItineraryEventBody } from '../../types/api';

// -------------------- Hook --------------------

export function useUpdateItineraryEvent(
  tripId: string,
  itineraryEventId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateItineraryEventBody) =>
      updateItineraryEvent(tripId, itineraryEventId, body),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: itineraryKeys.detail(tripId, itineraryEventId),
      });

      void queryClient.invalidateQueries({
        queryKey: itineraryKeys.lists(tripId),
      });
    },
  });
}
