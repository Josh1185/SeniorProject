/**
 * FILE: ItineraryEventDetailModal.tsx
 * DESCRIPTION: Displays the full details of an individual itinerary event.
 */



// -------------------- Component imports --------------------
import { DetailModal, DetailField } from '../DetailModal';

// -------------------- Hook imports --------------------
import { useItineraryEvent } from '../../hooks/itinerary/useItineraryEvent';

// -------------------- Helper Functions --------------------
function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// -------------------- Component --------------------
interface ItineraryEventDetailModalProps {
  tripId: string | undefined;
  itineraryEventId: string | undefined;
  eventTitle: string;
  onClose: () => void;
}

export function ItineraryEventDetailModal({
  tripId,
  itineraryEventId,
  eventTitle,
  onClose,
}: ItineraryEventDetailModalProps) {
  const {
    data,
    isLoading,
    error,
  } = useItineraryEvent(tripId, itineraryEventId);

  const event = data?.itineraryEvent;

  return (
    <DetailModal
      open={Boolean(itineraryEventId)}
      onClose={onClose}
      title={eventTitle}
      isLoading={isLoading}
      error={error}
    >
      <DetailField label="Title">
        {event?.title}
      </DetailField>

      <DetailField label="Description" full>
        {event?.description}
      </DetailField>

      <DetailField label="Start">
        {event ? formatDateTime(event.startDateTime) : undefined}
      </DetailField>

      <DetailField label="End">
        {event ? formatDateTime(event.endDateTime) : undefined}
      </DetailField>

      <DetailField label="Location">
        {event?.locationName}
      </DetailField>

      <DetailField label="Address" full>
        {event?.locationAddress}
      </DetailField>

      <DetailField label="Coordinates" full>
        {event?.latitude != null && event?.longitude != null
          ? `${event.latitude}, ${event.longitude}`
          : undefined}
      </DetailField>
    </DetailModal>
  );
}
