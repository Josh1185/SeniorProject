/**
 * FILE: useTripInvitations.ts
 * DESCRIPTION: Every invitation sent for one trip. Owner-only.
 *
 * LAST UPDATED: 2026-11-16 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useQuery } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { invitationKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { fetchTripInvitations } from '../../services/invitationService';

// -------------------- Hook --------------------
export function useTripInvitations(tripId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: invitationKeys.trip(tripId ?? ''),
    queryFn: () => {
      if (!tripId) throw new Error('useTripInvitations called without a trip id');
      return fetchTripInvitations(tripId);
    },

    // `enabled` is a parameter as well as an id check, because this endpoint
    // is owner-only: calling it as a member returns 404, and a 404 rendered
    // as an error on the Members page would be noise rather than information.
    // The caller passes `yourRole === 'OWNER'`.
    enabled: Boolean(tripId) && enabled,
  });
}
