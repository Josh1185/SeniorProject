
/**
 * FILE: ReservationDetailModal.tsx
 * DESCRIPTION: Read-only detail modal for a reservation.
 *              Uses the shared DetailModal and DetailField components.
 *
 * LAST UPDATED: 2026-11-12 - File Created (Antony Benitez)
 */

// -------------------- Type imports --------------------

import type {
  ReservationListItem,
  ReservationType,
} from '../../types/api';

// -------------------- Component imports --------------------

import { DetailModal, DetailField } from '../DetailModal';

// -------------------- Hook imports --------------------

import { useReservation } from '../../hooks/reservations/useReservation';

// -------------------- Lib imports --------------------

import { formatCents } from '../../lib/format';

// -------------------- Props interface --------------------

interface ReservationDetailModalProps {
  tripId: string | undefined;
  reservation: ReservationListItem | null;
  onClose: () => void;
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
}: ReservationDetailModalProps) {
  // ----- 1. Fetch details for the selected reservation -----

  const detailQuery = useReservation(
    tripId,
    reservation?.id,
  );

  const detail = detailQuery.data?.reservation;

  // ----- 2. Render the modal -----

  return (
    <DetailModal
      open={reservation !== null}
      onClose={onClose}
      title={reservation?.name ?? 'Reservation Details'}
      isLoading={reservation !== null && detailQuery.isPending}
      error={reservation !== null ? detailQuery.error : null}
    >
      {detail && (
        <>
          <DetailField label="Reservation Type">
            {formatReservationType(detail.type)}
          </DetailField>

          <DetailField label="Confirmation Number">
            {detail.confirmationNumber}
          </DetailField>

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
