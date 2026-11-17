/**
 * FILE: useRevokeInvitation.ts
 * DESCRIPTION: Revokes a pending invitation, killing its link.
 *
 * LAST UPDATED: 2026-11-16 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { invitationKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { revokeInvitation } from '../../services/invitationService';

// -------------------- Hook --------------------
export function useRevokeInvitation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    // The id is an argument rather than baked into the hook, so one instance
    // serves every row in the list instead of one hook per row - which would
    // break the rules of hooks the moment the list changed length.
    mutationFn: (invitationId: string) => revokeInvitation(tripId, invitationId),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.trip(tripId) });
    },
  });
}
