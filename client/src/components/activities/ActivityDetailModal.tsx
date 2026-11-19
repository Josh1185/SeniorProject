/**
 * FILE: ActivityDetailModal.tsx
 * DESCRIPTION: Displays one activity's full details in a read-only modal.
 *
 * LAST UPDATED: 2026-11-12 - Add activity edit and delete callbacks and action buttons (Brandon Douglass)
 *               2026-11-06 - File Created (Brandon Douglass)
 */

// -------------------- Type imports --------------------
import type { ActivityDetail, ActivityListItem } from '../../types/api';

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
  onEdit: (activity: ActivityDetail) => void;
  onDelete: (activity: ActivityDetail) => void;
}

// -------------------- Component --------------------

export function ActivityDetailModal({
  tripId,
  activity,
  onClose,
  onEdit,
  onDelete,
}: ActivityDetailModalProps) {
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

      <DetailField label="Date & Time">
        {data?.suggestedDateTime
          ? `${formatDate(data.suggestedDateTime)} at ${new Date(
              data.suggestedDateTime,
            ).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}`
          : null}
      </DetailField>

      <DetailField label="Estimated Cost">
        {data?.estimatedCostCents != null ? formatCents(data.estimatedCostCents) : null}
      </DetailField>

      <DetailField label="Votes">{data?.voteCount}</DetailField>

      <DetailField label="Created By">{data?.createdBy.displayName}</DetailField>

      <DetailField label="Description" full>
        {data?.description}
      </DetailField>

      {/* Allow editing or deleting the selected activity. */}
      {data && (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(data)}
            className="cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Edit Activity
          </button>

          <button
            type="button"
            onClick={() => onDelete(data)}
            className="cursor-pointer rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete Activity
          </button>
        </div>
      )}
    </DetailModal>
  );
}
