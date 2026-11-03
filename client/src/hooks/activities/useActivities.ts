/**
 * FILE: useActivities.ts
 * DESCRIPTION: Fetches and caches a trip's activities using React Query.
 *
 * LAST UPDATED: 2026-11-03 - File Created (Brandon Douglass)
 */

// -------------------- Module imports --------------------
import { useQuery } from '@tanstack/react-query';

// -------------------- Service imports --------------------
import { fetchActivities } from '../../services/activityService';
import type { ActivityFilters } from '../../services/activityService';

// -------------------- Query key imports --------------------
import { activityKeys } from '../../lib/queryKeys';

/**
 * Retrieves activities for a trip using optional search and sort filters.
 */
export function useActivities(tripId: string | undefined, filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: activityKeys.list(tripId ?? '', filters),
    queryFn: () => fetchActivities(tripId!, filters),
    enabled: Boolean(tripId),
  });
}
