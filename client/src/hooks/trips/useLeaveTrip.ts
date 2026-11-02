import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tripKeys } from '../../lib/queryKeys';
import { leaveTrip } from '../../services/tripService';

export function useLeaveTrip(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => leaveTrip(tripId),

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
