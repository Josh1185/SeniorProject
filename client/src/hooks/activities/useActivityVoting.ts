/**
 * FILE: useActivityVoting.ts
 * DESCRIPTION: React Query mutations for voting and un-voting on trip activities.
 *
 * LAST UPDATED: 2026-11-19 - File Created (Brandon Douglass)
 */

// -------------------- Module imports --------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

// -------------------- Service imports --------------------
import { voteForActivity, removeActivityVote } from '../../services/activityService';

// -------------------- Query key imports --------------------
import { activityKeys } from '../../lib/queryKeys';

/**
 * Votes for an activity and refreshes the activity list and details.
 */
export function useVoteForActivity(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => voteForActivity(tripId, activityId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.all(tripId) });
    },
  });
}

/**
 * Removes a vote and refreshes the activity list and details.
 */
export function useRemoveActivityVote(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => removeActivityVote(tripId, activityId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.all(tripId) });
    },
  });
}
