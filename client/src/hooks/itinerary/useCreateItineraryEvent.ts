/**
 * FILE: useCreateItineraryEvent.ts
 * DESCRIPTION: Creates an itinerary event and refreshes the itinerary.
 */

// -------------------- Module imports --------------------

import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------

import { itineraryKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------

import { createItineraryEvent } from '../../services/itineraryService';

// -------------------- Type imports --------------------

import type { CreateItineraryEventBody } from '../../types/api';

// -------------------- Hook --------------------

export function useCreateItineraryEvent(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateItineraryEventBody) =>
      createItineraryEvent(tripId, body),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: itineraryKeys.lists(tripId),
      });
    },
  });
}
