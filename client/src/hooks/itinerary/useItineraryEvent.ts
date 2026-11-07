/**
 * FILE: useItineraryEvent.ts
 * DESCRIPTION: Fetches one itinerary event with its full details.
 */

// -------------------- Module imports --------------------
import { useQuery } from '@tanstack/react-query';

// -------------------- Service imports --------------------
import { fetchItineraryEvent } from '../../services/itineraryService';

// -------------------- Lib imports --------------------
import { itineraryKeys } from '../../lib/queryKeys';

// -------------------- Hook --------------------
export function useItineraryEvent(
  tripId: string | undefined,
  itineraryEventId: string | undefined,
) {
  return useQuery({
    queryKey: itineraryKeys.detail(
      tripId ?? '',
      itineraryEventId ?? '',
    ),

    queryFn: () => {
      if (!tripId || !itineraryEventId) {
        throw new Error('Trip ID and itinerary event ID are required');
      }

      return fetchItineraryEvent(tripId, itineraryEventId);
    },

    enabled: Boolean(tripId) && Boolean(itineraryEventId),
  });
}
