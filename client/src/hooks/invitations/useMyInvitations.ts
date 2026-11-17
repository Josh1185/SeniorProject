/**
 * FILE: useMyInvitations.ts
 * DESCRIPTION: The signed-in user's own pending invitations.
 *
 *              Not scoped to a trip - that is the point. It answers "what have
 *              I been invited to", across trips the caller cannot otherwise
 *              see.
 *
 * LAST UPDATED: 2026-11-16 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useQuery } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { invitationKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { fetchMyInvitations } from '../../services/invitationService';

// -------------------- Hook --------------------
export function useMyInvitations() {
  return useQuery({
    queryKey: invitationKeys.mine(),
    queryFn: fetchMyInvitations,
  });
}
