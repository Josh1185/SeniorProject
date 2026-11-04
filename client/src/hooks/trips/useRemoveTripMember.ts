import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tripKeys } from '../../lib/queryKeys';
import { removeTripMember } from '../../services/tripService';

export function useRemoveTripMember(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeTripMember(tripId, userId),

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
