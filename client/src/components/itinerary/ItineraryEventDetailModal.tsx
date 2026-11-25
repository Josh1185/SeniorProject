/**
 * FILE: ItineraryEventDetailModal.tsx
 * DESCRIPTION: Displays the full details of an individual itinerary event.
 *
 * LAST UPDATED: 2026-11-23 - Replace the Coordinates field with MapView (Josh Iehle)
 */

// -------------------- React imports --------------------
import { useState } from 'react';

// -------------------- Type imports --------------------
import type { ItineraryEventDetail } from '../../types/api';

// -------------------- Component imports --------------------
import { DetailModal, DetailField } from '../DetailModal';
import { ConfirmDialog } from '../ConfirmDialog';
import { MapView } from '../MapView';

// -------------------- Hook imports --------------------
import { useItineraryEvent } from '../../hooks/itinerary/useItineraryEvent';
import { useDeleteItineraryEvent } from '../../hooks/itinerary/useDeleteItineraryEvent';

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

// -------------------- Prop Interface --------------------
interface ItineraryEventDetailModalProps {
  tripId: string | undefined;
  itineraryEventId: string | undefined;
  eventTitle: string;
  onClose: () => void;
  onEdit: (event: ItineraryEventDetail) => void;
}

// -------------------- Component --------------------
export function ItineraryEventDetailModal({
  tripId,
  itineraryEventId,
  eventTitle,
  onClose,
  onEdit,
}: ItineraryEventDetailModalProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const {
    data,
    isLoading,
    error,
  } = useItineraryEvent(tripId, itineraryEventId);

  const deleteMutation = useDeleteItineraryEvent(
    tripId ?? '',
    itineraryEventId ?? '',
  );

  const event = data?.itineraryEvent;

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync();
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch {
      // Keep the confirmation open so the user can see the error and retry.
    }
  }

  const deleteError =
    deleteMutation.error instanceof Error
      ? deleteMutation.error.message
      : undefined;

  return (
    <>
      <DetailModal
        open={Boolean(itineraryEventId)}
        onClose={onClose}
        title={eventTitle}
        isLoading={isLoading}
        error={error}
        actions={
          event ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-100"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => {
                  deleteMutation.reset();
                  setIsDeleteConfirmOpen(true);
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </>
          ) : undefined
        }
      >
        <DetailField label="Title">{event?.title}</DetailField>
                <DetailField label="Linked to">
          {event?.activity
            ? `Activity: ${event.activity.name}`
            : event?.reservation
              ? `Reservation: ${event.reservation.name}`
              : 'None'}
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
        <DetailField label="Location">{event?.locationName}</DetailField>
        <DetailField label="Address" full>
          {event?.locationAddress}
        </DetailField>

        {/*
          THIS REPLACES THE "Coordinates" FIELD. "28.474012, -81.468170" is
          the raw column, not information - nobody reading an itinerary can
          tell from two decimals whether that is the right hotel. The map says
          the same thing in a form a person can actually check, and the link
          below it is what they wanted the number for anyway.

          Same coordinates, same nullability: when they are missing, MapView
          renders nothing rather than an em dash for a field no reader asked
          about.
        */}
        <MapView
          latitude={event?.latitude}
          longitude={event?.longitude}
          label={event?.locationName ?? event?.locationAddress ?? null}
          className="sm:col-span-2"
        />
      </DetailModal>

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete itinerary event?"
        description={
          deleteError
            ? `This action cannot be undone. Deletion failed: ${deleteError}`
            : `Are you sure you want to delete "${event?.title ?? eventTitle}"? This action cannot be undone.`
        }
        confirmLabel="Delete Event"
        destructive
        pending={deleteMutation.isPending}
      />
    </>
  );
}
