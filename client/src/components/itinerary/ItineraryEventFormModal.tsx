/**
 * FILE: ItineraryEventFormModal.tsx
 * DESCRIPTION: Shared create/edit form for standalone itinerary events.
 */

// -------------------- Type imports --------------------
import type { ItineraryEventDetail } from '../../types/api';
import type { LocationValue } from '../../lib/location';

// -------------------- Module and lib imports --------------------
import { useActionState, useState } from 'react';
import { readFormValues, type FormState } from '../../lib/formState';

// -------------------- Component imports --------------------
import { Modal } from '../Modal';
import { TextField } from '../form/TextField';
import { TextArea } from '../form/TextArea';
import { DateTimeInput } from '../form/DateTimeInput';
import { useCreateItineraryEvent } from '../../hooks/itinerary/useCreateItineraryEvent';
import { useUpdateItineraryEvent } from '../../hooks/itinerary/useUpdateItineraryEvent';
import { emptyLocation } from '../../lib/location';
import { LocationPicker } from '../LocationPicker';
import { useActivities } from '../../hooks/activities/useActivities';
import { useReservations } from '../../hooks/reservations/useReservations';
import { FormField } from '../form/FormField';
import { controlClasses } from '../form/fieldStyles';

// -------------------- Types --------------------

interface ItineraryEventFormValues extends Record<string, string> {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  locationName: string;
}

interface ItineraryEventFormModalProps {
  open: boolean;
  tripId: string | undefined;
  startDate: string;
  endDate: string;
  event?: ItineraryEventDetail;
  onClose: () => void;
}

const FIELD_NAMES = [
  'title',
  'description',
  'startDateTime',
  'endDateTime',
  'locationName',
] as const;

// -------------------- Date helpers --------------------

/**
 * Converts a stored ISO timestamp into the local wall-clock string
 * expected by DateTimeInput.
 */
function toLocalDateTimeInput(value: string | null | undefined): string {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const pad = (number: number) => String(number).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/**
 * Converts a local wall-clock input string into a UTC ISO timestamp.
 */
function toIsoDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Please enter a valid date and time.');
  }

  return date.toISOString();
}

// -------------------- Form helpers --------------------

function getInitialValues(
  event?: ItineraryEventDetail,
): ItineraryEventFormValues {
  return {
    title: event?.title ?? '',
    description: event?.description ?? '',
    startDateTime: toLocalDateTimeInput(event?.startDateTime),
    endDateTime: toLocalDateTimeInput(event?.endDateTime),
    locationName: event?.locationName ?? '',
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

// -------------------- Component --------------------

export function ItineraryEventFormModal({
  open,
  tripId,
  startDate,
  endDate,
  event,
  onClose,
}: ItineraryEventFormModalProps) {
  const createMutation = useCreateItineraryEvent(tripId ?? '');
  const updateMutation = useUpdateItineraryEvent(
    tripId ?? '',
    event?.id ?? '',
  );

  const isEdit = Boolean(event);
  const [linkType, setLinkType] = useState<
  'none' | 'activity' | 'reservation'
>(() =>
  event?.activityId
    ? 'activity'
    : event?.reservationId
      ? 'reservation'
      : 'none',
);

const [linkedRecordId, setLinkedRecordId] = useState(
  () => event?.activityId ?? event?.reservationId ?? '',
);

// Keep the selection synchronized if a different event is opened.


const activitiesQuery = useActivities(tripId);
const reservationsQuery = useReservations(tripId);

const activities = activitiesQuery.data?.activities ?? [];
const reservations = reservationsQuery.data?.reservations ?? [];
  const [location, setLocation] = useState<LocationValue>(() => ({
    ...emptyLocation,
    label: event?.locationAddress ?? '',
    fullAddress: event?.locationAddress ?? null,
    latitude: event?.latitude ?? null,
    longitude: event?.longitude ?? null,
  }));

  const [state, submitAction, isPending] = useActionState(
    async (
      _previous: FormState<ItineraryEventFormValues>,
      formData: FormData,
    ): Promise<FormState<ItineraryEventFormValues>> => {
      const values = readFormValues(formData, FIELD_NAMES);

      // Validate required fields.
      const fieldErrors: Record<string, string> = {};

      if (!values.title) {
        fieldErrors.title = 'Title is required.';
      }

      if (!values.startDateTime) {
        fieldErrors.startDateTime = 'Start date and time are required.';
      }

      // The datetime-local format is sortable as a string.
      if (
        values.startDateTime &&
        values.endDateTime &&
        values.endDateTime < values.startDateTime
      ) {
        fieldErrors.endDateTime =
          'End date and time cannot be before the start.';
      }

      // Events must fall within the trip's inclusive date range.
      if (
        values.startDateTime &&
        (values.startDateTime.slice(0, 10) < startDate ||
        values.startDateTime.slice(0, 10) > endDate)
      ) {
        fieldErrors.startDateTime =
        'The event must fall within the trip dates.';
      }

      if (
        values.endDateTime &&
        (values.endDateTime.slice(0, 10) < startDate ||
        values.endDateTime.slice(0, 10) > endDate)
      ) {
      fieldErrors.endDateTime =
      'The event must fall within the trip dates.';
      }

      if (Object.keys(fieldErrors).length > 0) {
        return { values, fieldErrors };
      }

      if (!tripId) {
        return {
          values,
          formError: 'A trip is required to save an itinerary event.',
        };
      }

      try {
        const body = {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          title: values.title,
          description: values.description || null,
          startDateTime: toIsoDateTime(values.startDateTime),
          endDateTime: values.endDateTime
            ? toIsoDateTime(values.endDateTime)
            : null,
          locationName: values.locationName || null,
          locationAddress: location.label.trim() || null,
          latitude: location.latitude,
          longitude: location.longitude,
          activityId: linkType === 'activity' ? linkedRecordId || null : null,
          reservationId: linkType === 'reservation' ? linkedRecordId || null : null,
        };

        if (event) {
          await updateMutation.mutateAsync(body);
        } else {
          await createMutation.mutateAsync(body);
        }

        onClose();

        return { values };
      } catch (error) {
        return {
          values,
          formError: getErrorMessage(error),
        };
      }
    },
    { values: getInitialValues(event) },
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Itinerary Event' : 'Create Itinerary Event'}
    >
      <form action={submitAction} className="space-y-4">
        <TextField
          label="Title"
          name="title"
          required
          maxLength={200}
          defaultValue={state.values.title}
          error={state.fieldErrors?.title}
          placeholder="e.g. Visit the museum"
        />

        <TextArea
          label="Description"
          name="description"
          maxLength={2000}
          defaultValue={state.values.description}
          placeholder="Add details about this event..."
        />

        <DateTimeInput
          label="Start date and time"
          name="startDateTime"
          mode="datetime"
          required
          defaultValue={state.values.startDateTime}
          error={state.fieldErrors?.startDateTime}
        />

        <DateTimeInput
          label="End date and time"
          name="endDateTime"
          mode="datetime"
          min={
            state.values.startDateTime
            ? `${state.values.startDateTime.slice(0, 10)}T00:00`
            : undefined
          }
          defaultValue={state.values.endDateTime}
          error={state.fieldErrors?.endDateTime}
          hint="Optional. Must be after the start date and time."
        />

        <FormField label="Link to">
          {({ id, describedBy, invalid }) => (
            <select
              id={id}
              value={linkType}
              onChange={(event) => {
                const nextType = event.target.value as
                  | 'none'
                  | 'activity'
                  | 'reservation';

                setLinkType(nextType);
                setLinkedRecordId('');
              }}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={`${controlClasses(invalid)} cursor-pointer`}
            >
              <option value="none">None (standalone event)</option>
              <option value="activity">Activity</option>
              <option value="reservation">Reservation</option>
            </select>
          )}
        </FormField>

        {linkType === 'activity' && (
          <FormField label="Activity">
            {({ id, describedBy, invalid }) => (
              <select
                id={id}
                value={linkedRecordId}
                onChange={(event) => setLinkedRecordId(event.target.value)}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className={`${controlClasses(invalid)} cursor-pointer`}
              >
                <option value="">Select an activity</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name}
                  </option>
                ))}
              </select>
            )}
          </FormField>
        )}

        {linkType === 'reservation' && (
          <FormField label="Reservation">
            {({ id, describedBy, invalid }) => (
              <select
                id={id}
                value={linkedRecordId}
                onChange={(event) => setLinkedRecordId(event.target.value)}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className={`${controlClasses(invalid)} cursor-pointer`}
              >
                <option value="">Select a reservation</option>
                {reservations.map((reservation) => (
                  <option key={reservation.id} value={reservation.id}>
                    {reservation.name}
                  </option>
                ))}
              </select>
            )}
          </FormField>
        )}

        <TextField
          label="Location name"
          name="locationName"
          maxLength={200}
          defaultValue={state.values.locationName}
          placeholder="e.g. Central Park"
        />

        <LocationPicker
          label="Address"
          searchFor="address"
          value={location}
          onChange={setLocation}
          placeholder="Search for an address"
          hint="Optional. Pick a result to save its address and coordinates."
        />

        {state.formError && (
          <p role="alert" className="text-sm text-red-600">
            {state.formError}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink-900 hover:bg-surface-muted disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isPending || !tripId}
            className="cursor-pointer rounded-md border border-ink-300 bg-ink-900 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending
              ? 'Saving...'
              : isEdit
                ? 'Save Changes'
                : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
