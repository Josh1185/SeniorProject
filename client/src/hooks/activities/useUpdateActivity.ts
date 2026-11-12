/**
 * FILE: useUpdateActivity.ts
 * DESCRIPTION: Updates an activity and refreshes its detail and activity lists.
 *
 * LAST UPDATED: 2026-11-12 - File Created (Brandon Douglass)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { activityKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { updateActivity } from '../../services/activityService';

// -------------------- Type imports --------------------
import type { UpdateActivityBody } from '../../types/api';

// -------------------- Hook --------------------
export function useUpdateActivity(tripId: string, activityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateActivityBody) => updateActivity(tripId, activityId, body),

    // Refresh the edited activity's details and all cached activity lists.
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: activityKeys.detail(tripId, activityId),
      });
      void queryClient.invalidateQueries({
        queryKey: activityKeys.lists(tripId),
      });
    },
  });
}
