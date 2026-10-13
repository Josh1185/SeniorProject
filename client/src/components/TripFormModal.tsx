/**
 * FILE: TripFormModal.tsx
 * DESCRIPTION: Create and edit a trip. One component for both, because the
 *              fields and validation are identical - only the verb differs.
 *
 *              Pass `trip` to edit, omit it to create. That is the pattern
 *              every feature's form modal should follow: two near-identical
 *              components drift apart within a month.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { TripDetail } from '../types/api';

// -------------------- Module and lib imports --------------------
import { useActionState, useState } from 'react';
import { useCreateTrip } from '../hooks/trips/useCreateTrip';
import { useUpdateTrip } from '../hooks/trips/useUpdateTrip';
import { toDateInputValue } from '../lib/format';

// -------------------- Component imports --------------------
import { DestinationInput } from './DestinationInput';
import { Modal } from './Modal';
import { TextField } from './TextField';

// -------------------- Props interface --------------------
interface TripFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Present = edit mode. Absent = create mode. */
  trip?: TripDetail;
  /** Called with the trip id after a successful create. */
  onCreated?: (tripId: string) => void;
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
  // Returning a string sets the error; returning null clears it. React tracks
  // `isPending` for us, so there is no separate loading flag to forget.
  const [error, submitAction, isPending] = useActionState(
    async (_previousError: string | null, formData: FormData) => {
      const body = {
        name: String(formData.get('name') ?? '').trim(),
        destination: destination.trim(),
        startDate: String(formData.get('startDate') ?? ''),
        endDate: String(formData.get('endDate') ?? ''),
        description: String(formData.get('description') ?? '').trim() || undefined,
      };

      // Checked here as well as on the server. The server is the real guard;
      // this just saves a round trip and gives instant feedback.
      if (body.endDate < body.startDate) {
        return 'End date must be on or after the start date.';
      }

      try {
        if (isEdit) {
          await updateTrip.mutateAsync(body);
        } else {
          const created = await createTrip.mutateAsync(body);
          onCreated?.(created.trip.id);
        }

        onClose();
        return null;
      } catch (mutationError) {
        // ApiError carries the server's message, which for a 422 is the
        // specific field problem rather than a generic failure.
        return mutationError instanceof Error ? mutationError.message : 'Something went wrong.';
      }
    },
    null,
  );

  // ----- 4. Render -----
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Trip' : 'Create New Trip'}>
      {/* `key` remounts the form when switching between trips, so the
          uncontrolled inputs pick up the new defaultValues. Without it, React
          reuses the DOM nodes and you edit trip B with trip A's values. */}
      <form key={trip?.id ?? 'new'} action={submitAction} className="space-y-4">
        <TextField
          label="Trip Name"
          name="name"
          required
          maxLength={120}
          defaultValue={trip?.name ?? ''}
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
          {/* type="date" gives a native picker and always submits YYYY-MM-DD,
              which is exactly what z.iso.date() on the server expects. The
              wireframe's MM-DD-YYYY placeholder does not apply - the browser
              renders its own format based on the user's locale. */}
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            required
            defaultValue={toDateInputValue(trip?.startDate)}
          />
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            required
            defaultValue={toDateInputValue(trip?.endDate)}
          />
        </div>

        <label className="block text-sm font-medium text-ink-900">
          Description
          <textarea
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={trip?.description ?? ''}
            placeholder="Enter your trip description"
            className="mt-1 w-full resize-y rounded-md border-2 border-ink-300 bg-ink-100 px-3 py-2 text-ink-900"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
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
