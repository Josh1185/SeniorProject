import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tripKeys } from '../../lib/queryKeys';
import { changeTripMemberRole } from '../../services/tripService';
import type { TripRole } from '../../types/api';

interface ChangeMemberRoleVariables {
  userId: string;
  role: TripRole;
}

export function useChangeTripMemberRole(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: ChangeMemberRoleVariables) =>
      changeTripMemberRole(tripId, userId, role),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tripKeys.detail(tripId),
      });

      void queryClient.invalidateQueries({
        queryKey: tripKeys.lists(),
      });
    },
  });
}
