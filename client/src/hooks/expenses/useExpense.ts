/**
 * FILE: useExpense.ts
 * DESCRIPTION: One expense with its full participant breakdown.
 *
 * LAST UPDATED: 2026-11-02 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useQuery } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { expenseKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { fetchExpense } from '../../services/expenseService';

// -------------------- Hook --------------------
export function useExpense(tripId: string | undefined, expenseId: string | undefined) {
  return useQuery({
    // BOTH ids are in the key. Leave expenseId out and every expense shares
    // one cache entry, so opening a second row shows the first one's data -
    // which looks exactly like a backend bug and is not one.
    queryKey: expenseKeys.detail(tripId ?? '', expenseId ?? ''),

    queryFn: () => {
      // `enabled` below means this never runs without both ids, but TypeScript
      // cannot know that. Throwing is more honest than a non-null assertion.
      if (!tripId || !expenseId) throw new Error('useExpense called without ids');
      return fetchExpense(tripId, expenseId);
    },

    // While the modal is closed expenseId is undefined, so this hook sits idle
    // and fires nothing. The modal stays mounted the whole time; this is what
    // stops that costing a request per render.
    enabled: Boolean(tripId) && Boolean(expenseId),
  });
}
