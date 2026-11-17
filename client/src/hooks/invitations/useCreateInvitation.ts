/**
 * FILE: useCreateInvitation.ts
 * DESCRIPTION: Invites an email address to a trip.
 *
 * LAST UPDATED: 2026-11-16 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { invitationKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { createInvitation } from '../../services/invitationService';

// -------------------- Type imports --------------------
import type { CreateInvitationBody } from '../../types/api';

// -------------------- Hook --------------------
export function useCreateInvitation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateInvitationBody) => createInvitation(tripId, body),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.trip(tripId) });
    },
  });
}
