/**
 * FILE: useCreateExpense.ts
 * DESCRIPTION: Creates an expense and refreshes the list.
 *
 * LAST UPDATED: 2026-11-02 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { expenseKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { createExpense } from '../../services/expenseService';

// -------------------- Type imports --------------------
import type { CreateExpenseBody } from '../../types/api';

// -------------------- Hook --------------------
export function useCreateExpense(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateExpenseBody) => createExpense(tripId, body),

    // Invalidating lists(tripId) rather than one specific list refreshes EVERY
    // cached filter combination, because lists() is a prefix of all of them.
    // It also refreshes totalCents, which rides along in the list response.
    //
    // WHEN E-6 LANDS: the balances query belongs here too. Creating an expense
    // changes who owes what, and a stale balance is worse than a stale list.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expenseKeys.lists(tripId) });
    },
  });
}
