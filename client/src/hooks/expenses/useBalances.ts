/**
 * FILE: useBalances.ts
 * DESCRIPTION: Who owes who on a trip.
 *
 *              Called in TWO places with the same key: the Expenses page, for
 *              the "your balance" line under the heading, and BalancesModal,
 *              for the full breakdown. React Query dedupes them into one
 *              request and one cache entry, so the modal opens on numbers
 *              that are already there rather than a spinner.
 *
 *              That is also why there is no `enabled` gate on the modal being
 *              open - the page needs these numbers whether or not anyone has
 *              opened the dialog.
 *
 * LAST UPDATED: 2026-11-17 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useQuery } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { expenseKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { fetchBalances } from '../../services/expenseService';

// -------------------- Hook --------------------
export function useBalances(tripId: string | undefined) {
  return useQuery({
    queryKey: expenseKeys.balances(tripId ?? ''),
    queryFn: () => {
      // `enabled` below means this never runs without an id, but TypeScript
      // cannot know that. Throwing is more honest than a non-null assertion.
      if (!tripId) throw new Error('useBalances called without a trip id');
      return fetchBalances(tripId);
    },

    // Stops a request firing with `undefined` in the URL on the first render,
    // before useParams has resolved.
    enabled: Boolean(tripId),
  });
}
