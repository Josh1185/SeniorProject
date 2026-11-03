/**
 * FILE: useExpenses.ts
 * DESCRIPTION: A trip's expenses, with optional search and sort.
 *
 * LAST UPDATED: 2026-11-02 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { keepPreviousData, useQuery } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { expenseKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { fetchExpenses, type ExpenseFilters } from '../../services/expenseService';

// -------------------- Hook --------------------
export function useExpenses(tripId: string | undefined, filters: ExpenseFilters = {}) {
  return useQuery({
    // tripId is part of the key, not just the URL. Without it, two trips'
    // expense lists would share one cache entry and navigating between trips
    // would show the wrong rows until a refetch landed.
    queryKey: expenseKeys.list(tripId ?? '', filters),

    queryFn: () => {
      // `enabled` below means this never runs without an id, but TypeScript
      // cannot know that. Throwing is more honest than a non-null assertion.
      if (!tripId) throw new Error('useExpenses called without a trip id');
      return fetchExpenses(tripId, filters);
    },

    // Stops a request firing with `undefined` in the URL on the first render,
    // before useParams has resolved.
    enabled: Boolean(tripId),

    // Keeps the previous results on screen while a new filter loads, instead
    // of blanking the list and snapping back. Without this, changing a
    // dropdown makes the page flash empty for a moment.
    placeholderData: keepPreviousData,
  });
}
