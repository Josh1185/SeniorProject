/**
 * FILE: useInvitationPreview.ts
 * DESCRIPTION: What a given invite link is an invitation to.
 *
 * LAST UPDATED: 2026-11-16 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useQuery } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { invitationKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { fetchInvitationByToken } from '../../services/invitationService';

// -------------------- Hook --------------------
export function useInvitationPreview(token: string | undefined) {
  return useQuery({
    queryKey: invitationKeys.byToken(token ?? ''),
    queryFn: () => {
      if (!token) throw new Error('useInvitationPreview called without a token');
      return fetchInvitationByToken(token);
    },

    enabled: Boolean(token),

    // A bad or used link will not become good by asking again, and this query
    // runs on a page someone landed on from a chat message - retrying three
    // times just makes the error take longer to appear.
    retry: false,
  });
}
