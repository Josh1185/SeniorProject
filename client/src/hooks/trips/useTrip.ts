/**
 * FILE: useTrip.ts
 * DESCRIPTION: One trip with its member roster.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useQuery } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { tripKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { fetchTrip } from '../../services/tripService';

// -------------------- Hook --------------------
export function useTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: tripKeys.detail(tripId ?? ''),
    queryFn: () => {
      // `enabled` below means this never runs with an undefined id, but
      // TypeScript cannot know that. Throwing is more honest than a `!`.
      if (!tripId) throw new Error('useTrip called without a trip id');
      return fetchTrip(tripId);
    },

    // Stops a request firing with `undefined` in the URL on the first render,
    // before useParams has resolved.
    enabled: Boolean(tripId),
  });
}
