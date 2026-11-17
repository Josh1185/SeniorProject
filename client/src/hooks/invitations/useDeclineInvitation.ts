/**
 * FILE: useDeclineInvitation.ts
 * DESCRIPTION: Declines an invitation. Joins nothing.
 *
 * LAST UPDATED: 2026-11-16 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { invitationKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { declineInvitation } from '../../services/invitationService';

// -------------------- Hook --------------------
export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => declineInvitation(token),

    // Only the invitation list. Unlike accept, declining changes nothing about
    // which trips you are in.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.mine() });
    },
  });
}
