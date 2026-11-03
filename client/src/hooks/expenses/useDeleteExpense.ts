/**
 * FILE: useDeleteExpense.ts
 * DESCRIPTION: Deletes an expense and clears it from the cache.
 *
 * LAST UPDATED: 2026-11-02 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { expenseKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { deleteExpense } from '../../services/expenseService';

// -------------------- Hook --------------------
export function useDeleteExpense(tripId: string, expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteExpense(tripId, expenseId),

    onSuccess: () => {
      // removeQueries, NOT invalidateQueries. Invalidating would refetch an
      // expense that no longer exists and hand you a 404 on the way out.
      queryClient.removeQueries({ queryKey: expenseKeys.detail(tripId, expenseId) });
      void queryClient.invalidateQueries({ queryKey: expenseKeys.lists(tripId) });
    },
  });
}
