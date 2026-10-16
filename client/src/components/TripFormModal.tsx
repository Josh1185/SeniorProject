/**
 * FILE: TripFormModal.tsx
 * DESCRIPTION: Create and edit a trip. One component for both, because the
 *              fields and validation are identical - only the verb differs.
 *
 *              Pass `trip` to edit, omit it to create. That is the pattern
 *              every feature's form modal should follow: two near-identical
 *              components drift apart within a month.
 *
 *              THIS IS THE WORKED EXAMPLE for the shared form components and
 *              for the FormState pattern. If you are building
 *              ActivityFormModal or ReservationFormModal, copy this shape.
 *
 * LAST UPDATED: 2026-10-16 - Shared form components; keep values on error (Josh Iehle)
 *               2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { TripDetail } from '../types/api';
import type { FormState } from '../lib/formState';

// -------------------- Module and lib imports --------------------
import { useActionState, useState } from 'react';
import { useCreateTrip } from '../hooks/trips/useCreateTrip';
import { useUpdateTrip } from '../hooks/trips/useUpdateTrip';
import { toDateInputValue } from '../lib/format';
import { readFormValues } from '../lib/formState';

// -------------------- Component imports --------------------
import { DestinationInput } from './DestinationInput';
import { Modal } from './Modal';
import { DateTimeInput } from './form/DateTimeInput';
import { TextArea } from './form/TextArea';
import { TextField } from './form/TextField';

// -------------------- Props interface --------------------
interface TripFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Present = edit mode. Absent = create mode. */
  trip?: TripDetail;
  /** Called with the trip id after a successful create. */
  onCreated?: (tripId: string) => void;
}

// -------------------- Form Values --------------------

/**
 * The uncontrolled fields, in the order they appear in the form.
 *
 * `destination` is NOT here: it is controlled separately below, because the
 * autocomplete writes to it programmatically.
 */
const FIELD_NAMES = ['name', 'startDate', 'endDate', 'description'] as const;

type TripFormValues = Record<(typeof FIELD_NAMES)[number], string>;

/** The values a form starts with: the trip being edited, or blank. */
function initialValues(trip: TripDetail | undefined): TripFormValues {
  return {
    name: trip?.name ?? '',
    startDate: toDateInputValue(trip?.startDate),
    endDate: toDateInputValue(trip?.endDate),
    description: trip?.description ?? '',
  };
}

// -------------------- Component --------------------
export function TripFormModal({ open, onClose, trip, onCreated }: TripFormModalProps) {
  const isEdit = Boolean(trip);

  // ----- 1. Controlled state for the destination -----
  // The other fields are uncontrolled and read from FormData on submit. The
  // destination has to be controlled because the autocomplete writes to it
  // programmatically when someone picks a suggestion.
  const [destination, setDestination] = useState(trip?.destination ?? '');

  // ----- 2. Mutations -----
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip(trip?.id ?? '');

  // ----- 3. Submit action -----
  // Returns a FormState, never a bare string. See lib/formState.ts: React 19
  // resets the form after this runs, so the returned `values` are what keep
  // the user's input on screen when validation fails.
  const [state, submitAction, isPending] = useActionState(
    async (
      _previous: FormState<TripFormValues>,
      formData: FormData,
    ): Promise<FormState<TripFormValues>> => {
      const values = readFormValues(formData, FIELD_NAMES);
      const trimmedDestination = destination.trim();

      // ----- Client-side checks -----
      // These duplicate the server's rules on purpose: the server is the real
      // guard, this just saves a round trip and points at the right field.
      // Everything the browser can enforce on its own - required, maxLength -
      // is an attribute on the control instead of a check here.
      // A form-level message rather than a field one, because DestinationInput
      // does not take an `error` prop yet. When it is replaced by a picker
      // built on FormField, this becomes a fieldError like the date one below.
      if (!trimmedDestination) {
        return { values, formError: 'Destination is required.' };
      }

      // String comparison, not Date parsing. Both are YYYY-MM-DD, and comparing
      // those lexicographically is the same as comparing the dates - with none
      // of the timezone exposure that `new Date(...)` brings.
      if (values.endDate < values.startDate) {
        return {
          values,
          fieldErrors: { endDate: 'End date must be on or after the start date.' },
        };
      }

      // ----- Submit -----
      const body = {
        name: values.name,
        destination: trimmedDestination,
        startDate: values.startDate,
        endDate: values.endDate,
        description: values.description || undefined,
      };

      try {
        if (isEdit) {
          await updateTrip.mutateAsync(body);
        } else {
          const created = await createTrip.mutateAsync(body);
          onCreated?.(created.trip.id);
        }

        onClose();

        // Blank values on success, so reopening the modal to create another
        // trip does not show the last one's text. The modal unmounts its
        // children while closed in most cases, but relying on that would make
        // this depend on Modal's internals.
        return { values: initialValues(trip) };
      } catch (mutationError) {
        // ApiError carries the server's message, which for a 422 is the
        // specific field problem rather than a generic failure.
        return {
          values,
          formError:
            mutationError instanceof Error ? mutationError.message : 'Something went wrong.',
        };
      }
    },
    { values: initialValues(trip) },
  );

  // ----- 4. Render -----
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Trip' : 'Create New Trip'}>
      {/* `key` remounts the form when switching between trips, which resets
          both the uncontrolled inputs and useActionState. Without it, React
          reuses the DOM nodes and you edit trip B with trip A's values. */}
      <form key={trip?.id ?? 'new'} action={submitAction} className="space-y-4">
        {/* Every defaultValue comes from state.values, not from `trip`. That is
            the whole fix for fields clearing on a failed submit - see
            lib/formState.ts. */}
        <TextField
          label="Trip Name"
          name="name"
          required
          maxLength={120}
          defaultValue={state.values.name}
          error={state.fieldErrors?.name}
          placeholder="Enter your trip name"
        />

        <DestinationInput
          label="Main Destination"
          name="destination"
          value={destination}
          onChange={setDestination}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {/* mode="date" is the default and gives a native picker that always
              submits YYYY-MM-DD, which is exactly what z.iso.date() expects.
              The wireframe's MM-DD-YYYY placeholder does not apply - the
              browser renders its own format from the user's locale. */}
          <DateTimeInput
            label="Start Date"
            name="startDate"
            required
            defaultValue={state.values.startDate}
            error={state.fieldErrors?.startDate}
          />
          <DateTimeInput
            label="End Date"
            name="endDate"
            required
            defaultValue={state.values.endDate}
            error={state.fieldErrors?.endDate}
          />
        </div>

        <TextArea
          label="Description"
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={state.values.description}
          error={state.fieldErrors?.description}
          placeholder="Enter your trip description"
        />

        {state.formError && (
          <p role="alert" className="text-sm text-red-600">
            {state.formError}
          </p>
        )}

        {/* Buttons sit at the bottom on desktop and stretch full width on
            mobile, where the modal is a full-screen sheet. */}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 duration-150 hover:bg-ink-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-brand-700 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Trip'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
