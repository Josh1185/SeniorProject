/**
 * FILE: ActivityDetailModal.tsx
 * DESCRIPTION: Displays one activity's full details in a read-only modal.
 *
 * LAST UPDATED: 2026-11-06 - File Created (Brandon Douglass)
 */

// -------------------- Type imports --------------------
import type { ActivityListItem } from '../../types/api';

// -------------------- Module and lib imports --------------------
import { formatCents, formatDate } from '../../lib/format';

// -------------------- Hook imports --------------------
import { useActivity } from '../../hooks/activities/useActivity';

// -------------------- Component imports --------------------
import { DetailField, DetailModal } from '../DetailModal';

// -------------------- Props interface --------------------
interface ActivityDetailModalProps {
  tripId: string | undefined;
  /** The selected activity, or null when the modal is closed. */
  activity: ActivityListItem | null;
  onClose: () => void;
}

// -------------------- Component --------------------

export function ActivityDetailModal({ tripId, activity, onClose }: ActivityDetailModalProps) {
  // Fetch the full activity details only when an activity is selected.
  const detail = useActivity(tripId, activity?.id);
  const data = detail.data?.activity;

  return (
    <DetailModal
      open={Boolean(activity)}
      onClose={onClose}
      title={activity?.name ?? ''}
      isLoading={detail.isLoading}
      error={detail.error as Error | null}
    >
      <DetailField label="Location">{data?.locationName}</DetailField>

      {/* Address is text-only. Map integration belongs to Sprint 3. */}
      <DetailField label="Address" full>
        {data?.locationAddress}
      </DetailField>

      <DetailField label="Suggested Date">
        {data?.suggestedDateTime ? formatDate(data.suggestedDateTime) : null}
      </DetailField>

      <DetailField label="Estimated Cost">
        {data?.estimatedCostCents != null ? formatCents(data.estimatedCostCents) : null}
      </DetailField>

      <DetailField label="Votes">{data?.voteCount}</DetailField>

      <DetailField label="Created By">{data?.createdBy.displayName}</DetailField>

      <DetailField label="Description" full>
        {data?.description}
      </DetailField>
    </DetailModal>
  );
}
