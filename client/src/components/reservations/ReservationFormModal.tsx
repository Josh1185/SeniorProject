/**
 * FILE: ReservationFormModal.tsx
 * DESCRIPTION: One form for creating and editing all reservation types.
 *
 * LAST UPDATED: 2026-11-12 - File Created (Antony Benitez)
 */

// -------------------- Type imports --------------------

import type { FormEvent } from 'react';

import type {
  CreateReservationBody,
  ReservationDetail,
  ReservationType,
} from '../../types/api';

// -------------------- Module and lib imports --------------------

import { useState } from 'react';

import {
  centsToDollars,
  dollarsToCents,
  MAX_AMOUNT_CENTS,
} from '../../lib/money';

// -------------------- Hook imports --------------------

import { useCreateReservation } from '../../hooks/reservations/useCreateReservation';
import { useUpdateReservation } from '../../hooks/reservations/useUpdateReservation';

// -------------------- Component imports --------------------

import { Modal } from '../Modal';
import { FormField } from '../form/FormField';
import { TextField } from '../form/TextField';
import { TextArea } from '../form/TextArea';
import { controlClasses } from '../form/fieldStyles';

// -------------------- Props --------------------

interface ReservationFormModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string | undefined;
  reservation?: ReservationDetail;
}

// -------------------- Form Types --------------------

interface ReservationFormValues {
  type: ReservationType | '';
  name: string;
  confirmationNumber: string;
  startDateTime: string;
  endDateTime: string;
  locationName: string;
  locationAddress: string;
  cost: string;
  notes: string;
}

type FormErrors = Partial<
  Record<keyof ReservationFormValues, string>
>;

// -------------------- Reservation Types --------------------

const RESERVATION_TYPES: {
  value: ReservationType;
  label: string;
}[] = [
  { value: 'FLIGHT', label: 'Flight' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'RENTAL_CAR', label: 'Rental Car' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'ATTRACTION', label: 'Attraction' },
  { value: 'OTHER', label: 'Other' },
];

// -------------------- Form Helpers --------------------

/**
 * Converts an API timestamp into local date/time input format.
 * HTML datetime-local inputs expect YYYY-MM-DDTHH:mm.
 */
function toLocalDateTime(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

/** Converts the user's local date/time into an ISO timestamp. */
function toApiDateTime(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

/** Empty optional text fields are stored as null. */
function optionalText(value: string): string | null {
  const trimmed = value.trim();

  return trimmed || null;
}

/** Starting form values for create or edit mode. */
function initialValues(
  reservation: ReservationDetail | undefined,
): ReservationFormValues {
  return {
    type: reservation?.type ?? '',
    name: reservation?.name ?? '',
    confirmationNumber: reservation?.confirmationNumber ?? '',
    startDateTime: toLocalDateTime(
      reservation?.startDateTime ?? null,
    ),
    endDateTime: toLocalDateTime(
      reservation?.endDateTime ?? null,
    ),
    locationName: reservation?.locationName ?? '',
    locationAddress: reservation?.locationAddress ?? '',
    cost:
      reservation?.costCents === null ||
      reservation?.costCents === undefined
        ? ''
        : centsToDollars(reservation.costCents),
    notes: reservation?.notes ?? '',
  };
}

// -------------------- Component --------------------

export function ReservationFormModal({
  open,
  onClose,
  tripId,
  reservation,
}: ReservationFormModalProps) {
  const isEdit = Boolean(reservation);

  // ----- 1. Form state -----

  const [values, setValues] = useState<ReservationFormValues>(
    () => initialValues(reservation),
  );

  const [fieldErrors, setFieldErrors] =
    useState<FormErrors>({});

  const [formError, setFormError] =
    useState<string | null>(null);

  // ----- 2. Mutations -----

  const createMutation = useCreateReservation(tripId ?? '');

  const updateMutation = useUpdateReservation(
    tripId ?? '',
    reservation?.id ?? '',
  );

  const isPending =
    createMutation.isPending || updateMutation.isPending;

  // ----- 3. Update a form field -----

  function updateField<K extends keyof ReservationFormValues>(
    field: K,
    value: ReservationFormValues[K],
  ) {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));

    setFormError(null);
  }

  // ----- 4. Submit form -----

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tripId) {
      setFormError('No trip was selected.');
      return;
    }

    const errors: FormErrors = {};

    const name = values.name.trim();

    // Required fields
    if (!name) {
      errors.name = 'Reservation name is required.';
    }

    if (!values.type) {
      errors.type = 'Select a reservation type.';
    }

    // Cost is optional, but must be valid when supplied.
    let costCents: number | null = null;

    if (values.cost.trim()) {
      const parsed = dollarsToCents(values.cost.trim());

      if (
        parsed === null ||
        parsed < 0 ||
        parsed > MAX_AMOUNT_CENTS
      ) {
        errors.cost =
          'Enter a valid, non-negative dollar amount.';
      } else {
        costCents = parsed;
      }
    }

    // Convert local dates to ISO timestamps with timezone.
    const startDateTime = toApiDateTime(values.startDateTime);
    const endDateTime = toApiDateTime(values.endDateTime);

    if (values.startDateTime && !startDateTime) {
      errors.startDateTime = 'Enter a valid start date and time.';
    }

    if (values.endDateTime && !endDateTime) {
      errors.endDateTime = 'Enter a valid end date and time.';
    }

    if (
      startDateTime &&
      endDateTime &&
      new Date(endDateTime) < new Date(startDateTime)
    ) {
      errors.endDateTime =
        'End date must be after the start date.';
    }

    // Stop if any validation errors exist.
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!values.type) {
      return;
    }

    // ----- 5. Build the API request -----

    const body: CreateReservationBody = {
      type: values.type,
      name,
      confirmationNumber: optionalText(
        values.confirmationNumber,
      ),
      startDateTime,
      endDateTime,
      locationName: optionalText(values.locationName),
      locationAddress: optionalText(values.locationAddress),
      costCents,
      notes: optionalText(values.notes),
    };

    // ----- 6. Create or update -----

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(body);
      } else {
        await createMutation.mutateAsync(body);
      }

      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to save the reservation.',
      );
    }
  }

  // ----- 7. Render -----

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Reservation' : 'Add Reservation'}
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-4"
      >
        {/* Reservation Name */}
        <TextField
          label="Reservation Name"
          name="name"
          required
          maxLength={200}
          value={values.name}
          onChange={(event) =>
            updateField('name', event.target.value)
          }
          error={fieldErrors.name}
          placeholder="Hilton New York"
        />

        {/* Reservation Type */}
        <FormField
          label="Reservation Type"
          required
          error={fieldErrors.type}
        >
          {({ id, describedBy, invalid }) => (
            <select
              id={id}
              name="type"
              required
              value={values.type}
              onChange={(event) =>
                updateField(
                  'type',
                  event.target.value as ReservationType | '',
                )
              }
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={`${controlClasses(invalid)} cursor-pointer`}
            >
              <option value="">Select a type</option>

              {RESERVATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          )}
        </FormField>

        {/* Confirmation Number */}
        <TextField
          label="Confirmation Number"
          name="confirmationNumber"
          maxLength={200}
          value={values.confirmationNumber}
          onChange={(event) =>
            updateField('confirmationNumber', event.target.value)
          }
          placeholder="ABC123"
        />

        {/* Start and End Date/Time */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Start Date/Time"
            error={fieldErrors.startDateTime}
          >
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                name="startDateTime"
                type="datetime-local"
                value={values.startDateTime}
                onChange={(event) =>
                  updateField('startDateTime', event.target.value)
                }
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className={controlClasses(invalid)}
              />
            )}
          </FormField>

          <FormField
            label="End Date/Time"
            error={fieldErrors.endDateTime}
          >
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                name="endDateTime"
                type="datetime-local"
                value={values.endDateTime}
                onChange={(event) =>
                  updateField('endDateTime', event.target.value)
                }
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className={controlClasses(invalid)}
              />
            )}
          </FormField>
        </div>

        {/* Location Name */}
        <TextField
          label="Location Name"
          name="locationName"
          maxLength={200}
          value={values.locationName}
          onChange={(event) =>
            updateField('locationName', event.target.value)
          }
          placeholder="Hilton New York"
        />

        {/* Address */}
        <TextField
          label="Address"
          name="locationAddress"
          maxLength={500}
          value={values.locationAddress}
          onChange={(event) =>
            updateField('locationAddress', event.target.value)
          }
          placeholder="Enter an address"
        />

        {/* Cost */}
        <TextField
          label="Cost"
          name="cost"
          inputMode="decimal"
          autoComplete="off"
          value={values.cost}
          onChange={(event) =>
            updateField('cost', event.target.value)
          }
          error={fieldErrors.cost}
          placeholder="850.00"
          hint="US dollars. Optional."
        />

        {/* Notes */}
        <TextArea
          label="Notes"
          name="notes"
          rows={3}
          maxLength={2000}
          value={values.notes}
          onChange={(event) =>
            updateField('notes', event.target.value)
          }
          placeholder="Anything worth remembering"
        />

        {/* API or form error */}
        {formError && (
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        )}

        {/* Form Actions */}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {isPending
              ? 'Saving…'
              : isEdit
                ? 'Save Changes'
                : 'Add Reservation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}