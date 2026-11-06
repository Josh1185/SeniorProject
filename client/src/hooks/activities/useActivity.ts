/**
 * FILE: useActivity.ts
 * DESCRIPTION: React Query hook for fetching one activity's details.
 *
 * LAST UPDATED: 2026-11-06 - File Created (Brandon Douglass)
 */

// -------------------- Module and lib imports --------------------
import { useQuery } from '@tanstack/react-query';
import { activityKeys } from '../../lib/queryKeys';
import { fetchActivity } from '../../services/activityService';

// -------------------- Hook --------------------

/**
 * Fetches one activity's details when both IDs are available.
 * An undefined activityId means no activity is selected.
 */
export function useActivity(tripId: string | undefined, activityId: string | undefined) {
  return useQuery({
    queryKey: activityKeys.detail(tripId ?? '', activityId ?? ''),
    queryFn: () => fetchActivity(tripId!, activityId!),
    enabled: Boolean(tripId && activityId),
  });
}
