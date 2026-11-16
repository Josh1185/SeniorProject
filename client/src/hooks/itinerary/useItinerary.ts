
import { useQuery } from '@tanstack/react-query';

import { fetchItinerary } from '../../services/itineraryService';
import { itineraryKeys } from '../../lib/queryKeys';

export function useItinerary(tripId: string | undefined) {
  return useQuery({
    queryKey: itineraryKeys.list(tripId ?? ''),
    queryFn: () => {
      if (!tripId) {
        throw new Error('Trip ID is required to fetch itinerary');
      }

      return fetchItinerary(tripId);
    },
    enabled: Boolean(tripId),
  });
}
