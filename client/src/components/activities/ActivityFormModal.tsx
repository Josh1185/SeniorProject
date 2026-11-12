/**
 * FILE: ActivityFormModal.tsx
 * DESCRIPTION: Creates and edits activities using a shared form modal.
 *
 * LAST UPDATED: 2026-11-12 - File Created (Brandon Douglass)
 */

// -------------------- Type imports --------------------
import type { ActivityDetail, CreateActivityBody } from '../../types/api';
import type { FormState } from '../../lib/formState';

// -------------------- Module and lib imports --------------------
import { useActionState } from 'react';
import { readFormValues } from '../../lib/formState';
import { toDateTimeInputValue } from '../../lib/format';
import { centsToDollars, dollarsToCents, MAX_AMOUNT_CENTS } from '../../lib/money';

// -------------------- Hook imports --------------------
import { useCreateActivity } from '../../hooks/activities/useCreateActivity';
import { useUpdateActivity } from '../../hooks/activities/useUpdateActivity';

// -------------------- Component imports --------------------
import { Modal } from '../Modal';
import { DateTimeInput } from '../form/DateTimeInput';
import { TextArea } from '../form/TextArea';
import { TextField } from '../form/TextField';

// -------------------- Props interface --------------------
interface ActivityFormModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string | undefined;
  /** Present = edit mode. Absent = create mode. */
  activity?: ActivityDetail;
}

// -------------------- Form Values --------------------
const FIELD_NAMES = [
  'name',
  'description',
  'suggestedDateTime',
  'locationName',
  'locationAddress',
  'estimatedCost',
] as const;

type ActivityFormValues = Record<(typeof FIELD_NAMES)[number], string>;

/** Initial values for creating or editing an activity. */
function initialValues(activity: ActivityDetail | undefined): ActivityFormValues {
  return {
    name: activity?.name ?? '',
    description: activity?.description ?? '',
    suggestedDateTime: toDateTimeInputValue(activity?.suggestedDateTime),
    locationName: activity?.locationName ?? '',
    locationAddress: activity?.locationAddress ?? '',
    estimatedCost:
      activity?.estimatedCostCents != null ? centsToDollars(activity.estimatedCostCents) : '',
  };
}

// -------------------- Component --------------------
export function ActivityFormModal({ open, onClose, tripId, activity }: ActivityFormModalProps) {
  const isEdit = Boolean(activity);

  // ----- 1. Hooks -----
  const createActivity = useCreateActivity(tripId ?? '');
  const updateActivity = useUpdateActivity(tripId ?? '', activity?.id ?? '');

  // ----- 2. Submit action -----
  const [state, submitAction, isPending] = useActionState(
    async (
      _previous: FormState<ActivityFormValues>,
      formData: FormData,
    ): Promise<FormState<ActivityFormValues>> => {
      const values = readFormValues(formData, FIELD_NAMES);

      // ----- Client-side validation -----
      if (!values.name) {
        return {
          values,
          fieldErrors: { name: 'Name is required.' },
        };
      }

      const estimatedCostCents = values.estimatedCost ? dollarsToCents(values.estimatedCost) : null;

      if (
        values.estimatedCost &&
        (estimatedCostCents === null || estimatedCostCents > MAX_AMOUNT_CENTS)
      ) {
        return {
          values,
          fieldErrors: { estimatedCost: 'Enter a valid dollar amount.' },
        };
      }

      // ----- Build request body -----
      const body: CreateActivityBody = {
        name: values.name,
        description: values.description,
        suggestedDateTime: values.suggestedDateTime || null,
        locationName: values.locationName,
        locationAddress: values.locationAddress,
        estimatedCostCents,
      };

      try {
        if (isEdit) {
          await updateActivity.mutateAsync(body);
        } else {
          await createActivity.mutateAsync(body);
        }

        onClose();
        return { values: initialValues(activity) };
      } catch (mutationError) {
        return {
          values,
          formError:
            mutationError instanceof Error ? mutationError.message : 'Something went wrong.',
        };
      }
    },
    { values: initialValues(activity) },
  );

  // ----- 3. Render -----
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Activity' : 'Add Activity'}>
      <form key={activity?.id ?? 'new'} action={submitAction} className="space-y-4">
        <TextField
          label="Activity Name"
          name="name"
          required
          maxLength={200}
          defaultValue={state.values.name}
          error={state.fieldErrors?.name}
          placeholder="Visit the Museum"
        />

        <TextArea
          label="Description"
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={state.values.description}
          error={state.fieldErrors?.description}
          placeholder="Describe the activity"
        />

        <DateTimeInput
          label="Suggested Date & Time"
          name="suggestedDateTime"
          mode="datetime"
          defaultValue={state.values.suggestedDateTime}
          error={state.fieldErrors?.suggestedDateTime}
        />

        <TextField
          label="Location Name"
          name="locationName"
          maxLength={200}
          defaultValue={state.values.locationName}
          error={state.fieldErrors?.locationName}
          placeholder="Museum of Natural History"
        />

        <TextField
          label="Location Address"
          name="locationAddress"
          maxLength={300}
          defaultValue={state.values.locationAddress}
          error={state.fieldErrors?.locationAddress}
          placeholder="200 Central Park West, New York, NY"
        />

        <TextField
          label="Estimated Cost"
          name="estimatedCost"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={state.values.estimatedCost}
          error={state.fieldErrors?.estimatedCost}
          placeholder="25.00"
          hint="US dollars (optional)"
        />

        {state.formError && (
          <p role="alert" className="text-sm text-red-600">
            {state.formError}
          </p>
        )}

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
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Activity'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
