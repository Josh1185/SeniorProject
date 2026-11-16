/**
 * FILE: useDeleteActivity.ts
 * DESCRIPTION: Deletes an activity and refreshes the activities list.
 *
 * LAST UPDATED: 2026-11-12 - File Created (Brandon Douglass)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Lib imports --------------------
import { activityKeys } from '../../lib/queryKeys';

// -------------------- Service imports --------------------
import { deleteActivity } from '../../services/activityService';

// -------------------- Hook --------------------
export function useDeleteActivity(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => deleteActivity(tripId, activityId),

    // Refresh all activity lists after an activity is deleted.
    // Remove the deleted activity's cached details.
    onSuccess: (_data, activityId) => {
      void queryClient.removeQueries({
        queryKey: activityKeys.detail(tripId, activityId),
      });
      void queryClient.invalidateQueries({
        queryKey: activityKeys.lists(tripId),
      });
    },
  });
}
