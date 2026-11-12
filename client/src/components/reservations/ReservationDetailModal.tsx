/**
 * FILE: ReservationDetailModal.tsx
 * DESCRIPTION: Reservation detail view with edit and delete actions.
 *
 * LAST UPDATED: 2026-11-12 - Add R5 actions (Antony Benitez)
 */

// -------------------- Type imports --------------------

import type {
  ReservationDetail,
  ReservationListItem,
  ReservationType,
} from '../../types/api';

// -------------------- Component imports --------------------

import { DetailModal, DetailField } from '../DetailModal';

// -------------------- Hook imports --------------------

import { useReservation } from '../../hooks/reservations/useReservation';

// -------------------- Lib imports --------------------

import { formatCents } from '../../lib/format';

// -------------------- Props --------------------

interface ReservationDetailModalProps {
  tripId: string | undefined;
  reservation: ReservationListItem | null;
  onClose: () => void;
  onEdit: (reservation: ReservationDetail) => void;
  onDelete: (reservation: ReservationDetail) => void;
}

// -------------------- Display Helpers --------------------

function formatReservationType(type: ReservationType): string {
  switch (type) {
    case 'FLIGHT':
      return 'Flight';
    case 'HOTEL':
      return 'Hotel';
    case 'RENTAL_CAR':
      return 'Rental Car';
    case 'RESTAURANT':
      return 'Restaurant';
    case 'ATTRACTION':
      return 'Attraction';
    case 'OTHER':
      return 'Other';
  }
}

function formatDateTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// -------------------- Component --------------------

export function ReservationDetailModal({
  tripId,
  reservation,
  onClose,
  onEdit,
  onDelete,
}: ReservationDetailModalProps) {
  // ----- 1. Fetch full reservation details -----

  const detailQuery = useReservation(
    tripId,
    reservation?.id,
  );

  const detail = detailQuery.data?.reservation;

  // ----- 2. Edit and Delete buttons -----

  const actions = detail ? (
    <>
      <button
        type="button"
        onClick={() => onEdit(detail)}
        className="cursor-pointer rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-100"
      >
        Edit Reservation
      </button>

      <button
        type="button"
        onClick={() => onDelete(detail)}
        className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Delete Reservation
      </button>
    </>
  ) : undefined;

  // ----- 3. Render -----

  return (
    <DetailModal
      open={reservation !== null}
      onClose={onClose}
      title={reservation?.name ?? 'Reservation Details'}
      isLoading={reservation !== null && detailQuery.isPending}
      error={reservation !== null ? detailQuery.error : null}
      actions={actions}
    >
      {detail && (
        <>
          <DetailField label="Reservation Type">
            {formatReservationType(detail.type)}
          </DetailField>

          <DetailField label="Confirmation Number">
            {detail.confirmationNumber}
          </DetailField>

          {/* Provider is not yet stored by the backend. */}
          <DetailField label="Provider">
            Not recorded
          </DetailField>

          <DetailField label="Cost">
            {detail.costCents === null
              ? null
              : formatCents(detail.costCents)}
          </DetailField>

          <DetailField label="Start Date/Time">
            {formatDateTime(detail.startDateTime)}
          </DetailField>

          <DetailField label="End Date/Time">
            {formatDateTime(detail.endDateTime)}
          </DetailField>

          <DetailField label="Location" full>
            {detail.locationName}
          </DetailField>

          <DetailField label="Address" full>
            {detail.locationAddress}
          </DetailField>

          <DetailField label="Notes" full>
            {detail.notes}
          </DetailField>
        </>
      )}
    </DetailModal>
  );
}