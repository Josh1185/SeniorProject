/**
 * FILE: useCreateActivity.ts
 * DESCRIPTION: Creates an activity and refreshes the activities list.
 *
 * LAST UPDATED: 2026-11-12 - File Created (Brandon Douglass)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { activityKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { createActivity } from '../../services/activityService';

// -------------------- Type imports --------------------
import type { CreateActivityBody } from '../../types/api';

// -------------------- Hook --------------------
export function useCreateActivity(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateActivityBody) => createActivity(tripId, body),

    // Refresh all cached activity lists, including different search and sort filters.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.lists(tripId) });
    },
  });
}
