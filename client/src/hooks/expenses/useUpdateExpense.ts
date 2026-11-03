/**
 * FILE: useUpdateExpense.ts
 * DESCRIPTION: Updates an expense and refreshes both the list and the detail.
 *
 * LAST UPDATED: 2026-11-02 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { expenseKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { updateExpense } from '../../services/expenseService';

// -------------------- Type imports --------------------
import type { UpdateExpenseBody } from '../../types/api';

// -------------------- Hook --------------------
export function useUpdateExpense(tripId: string, expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateExpenseBody) => updateExpense(tripId, expenseId, body),

    // BOTH caches. Changing an amount changes the detail modal's shares AND
    // the row in the list AND the trip total; forgetting the second is why an
    // edit sometimes looks like it did not save until you refresh.
    //
    // WHEN E-6 LANDS: add the balances query. An edited amount re-splits the
    // expense, so every balance derived from it has moved.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expenseKeys.detail(tripId, expenseId) });
      void queryClient.invalidateQueries({ queryKey: expenseKeys.lists(tripId) });
    },
  });
}
