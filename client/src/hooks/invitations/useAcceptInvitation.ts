/**
 * FILE: useAcceptInvitation.ts
 * DESCRIPTION: Accepts an invitation and joins the trip.
 *
 * LAST UPDATED: 2026-11-16 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { invitationKeys, tripKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { acceptInvitation } from '../../services/invitationService';

// -------------------- Hook --------------------
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => acceptInvitation(token),

    // THREE invalidations, and the trip one is the easy one to forget.
    // Accepting does not just resolve an invitation - it changes which trips
    // you are a member of, so the dashboard's trip list is now wrong. Without
    // tripKeys.lists() the user lands in a trip that does not appear in their
    // own list until the next refresh.
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: tripKeys.detail(data.tripId) });
    },
  });
}
