/**
 * FILE: ExpenseFormModal.tsx
 * DESCRIPTION: Create and edit an expense. One component for both, because the
 *              fields and validation are identical - only the verb differs.
 *              Pass `expense` to edit, omit it to create.
 *
 *              Copies TripFormModal's shape: uncontrolled fields read from
 *              FormData, a FormState returned from the action so values
 *              survive a failed submit, and one piece of controlled state for
 *              the control that cannot be uncontrolled.
 *
 *              TWO THINGS ARE SPECIFIC TO MONEY AND WORTH READING:
 *
 *              1. The amount field takes DOLLARS and the API takes integer
 *                 CENTS. lib/money.ts does that conversion with string
 *                 arithmetic - never parseFloat - and this form rejects
 *                 anything it cannot convert exactly.
 *
 *              2. The participant list shows each person's share live, as you
 *                 type. That preview is the only place a user ever sees that
 *                 $62.00 between three people is 20.67 / 20.67 / 20.66 rather
 *                 than three equal-looking numbers that do not add up. The
 *                 SERVER computes the real shares; this is advisory.
 *
 * LAST UPDATED: 2026-11-02 - Default a new expense to everyone (Josh Iehle)
 *               2026-11-02 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ExpenseDetail } from '../../types/api';
import type { FormState } from '../../lib/formState';

// -------------------- Module and lib imports --------------------
import { useActionState, useState } from 'react';
import { readFormValues } from '../../lib/formState';
import { toDateInputValue } from '../../lib/format';
import { formatCents } from '../../lib/format';
import {
  centsToDollars,
  dollarsToCents,
  MAX_AMOUNT_CENTS,
  previewSplit,
} from '../../lib/money';

// -------------------- Hook imports --------------------
import { useAuth } from '../../lib/auth/useAuth';
import { useCreateExpense } from '../../hooks/expenses/useCreateExpense';
import { useTrip } from '../../hooks/trips/useTrip';
import { useUpdateExpense } from '../../hooks/expenses/useUpdateExpense';

// -------------------- Component imports --------------------
import { Modal } from '../Modal';
import { DateTimeInput } from '../form/DateTimeInput';
import { FormField } from '../form/FormField';
import { TextArea } from '../form/TextArea';
import { TextField } from '../form/TextField';
import { controlClasses } from '../form/fieldStyles';

// -------------------- Props interface --------------------
interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string | undefined;
  /** Present = edit mode. Absent = create mode. */
  expense?: ExpenseDetail;
}

// -------------------- Form Values --------------------

/**
 * The uncontrolled fields, in the order they appear in the form.
 *
 * `participantIds` is NOT here: a checkbox group cannot round-trip through
 * FormState's Record<string, string>, and it is written programmatically by
 * the All / None buttons. It is controlled state below, the way the trip
 * form's destination is.
 */
const FIELD_NAMES = ['title', 'amount', 'expenseDate', 'paidById', 'description'] as const;

type ExpenseFormValues = Record<(typeof FIELD_NAMES)[number], string>;

/**
 * Today, in the user's own timezone.
 *
 * NOT new Date().toISOString().slice(0, 10) - that is today in UTC, which for
 * anyone west of Greenwich is tomorrow for part of every evening. An expense
 * dated a day in the future because someone opened the form at 8pm is the
 * exact class of bug the date rule in conventions.md section 4 is about.
 */
function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** The values a form starts with: the expense being edited, or sensible blanks. */
function initialValues(
  expense: ExpenseDetail | undefined,
  currentUserId: string | undefined,
): ExpenseFormValues {
  return {
    title: expense?.title ?? '',
    amount: expense ? centsToDollars(expense.amountCents) : '',
    expenseDate: expense ? toDateInputValue(expense.expenseDate) : todayLocal(),
    // Defaulting a NEW expense to "I paid" is a UI convenience, not the
    // server defaulting it - the request always carries paidById explicitly.
    paidById: expense?.paidBy.id ?? currentUserId ?? '',
    description: expense?.description ?? '',
  };
}

// -------------------- Component --------------------
export function ExpenseFormModal({ open, onClose, tripId, expense }: ExpenseFormModalProps) {
  const isEdit = Boolean(expense);

  // ----- 1. Hooks, all of them, before any branching -----
  const { session } = useAuth();
  const trip = useTrip(tripId);

  const members = trip.data?.trip.members ?? [];

  /**
   * Who the expense is split between.
   *
   * Controlled because the All / None buttons write to it, and because a
   * checkbox group cannot live in FormState. Being component state also means
   * it survives a failed submit for free - React 19 resets the FORM after an
   * action runs, not component state.
   *
   * Starts empty here and is filled in just below, once the roster has
   * loaded - see participantDefaultsApplied.
   */
  const [participantIds, setParticipantIds] = useState<string[]>(() =>
    expense ? expense.participants.map((participant) => participant.user.id) : [],
  );

  /** Mirrors the amount box so the split preview updates as it is typed. */
  const [amountInput, setAmountInput] = useState(() =>
    expense ? centsToDollars(expense.amountCents) : '',
  );

  /**
   * A NEW expense starts with everyone on the trip ticked, because splitting
   * between the whole group is the common case and starting empty would mean
   * ticking five boxes before most expenses could be saved.
   *
   * It cannot be done in the useState initialiser above: the roster comes from
   * useTrip and may not have arrived on the first render. So the default is
   * applied during render, once, as soon as members exist - the documented way
   * to adjust state when an external value changes. React throws this render
   * away and re-runs it before painting, so there is no flash of an empty list.
   *
   * The `if` is what stops it looping, and starting the flag at `isEdit` is
   * what stops it stamping over the participants of an expense being edited.
   */
  const [participantDefaultsApplied, setParticipantDefaultsApplied] = useState(isEdit);

  if (!participantDefaultsApplied && members.length > 0) {
    setParticipantDefaultsApplied(true);
    setParticipantIds(members.map((member) => member.user.id));
  }

  const createExpense = useCreateExpense(tripId ?? '');
  const updateExpense = useUpdateExpense(tripId ?? '', expense?.id ?? '');

  // ----- 2. Submit action -----
  // Returns a FormState, never a bare string. React 19 resets the form after
  // this runs, so the returned `values` are what keep the user's input on
  // screen when validation fails.
  const [state, submitAction, isPending] = useActionState(
    async (
      _previous: FormState<ExpenseFormValues>,
      formData: FormData,
    ): Promise<FormState<ExpenseFormValues>> => {
      const values = readFormValues(formData, FIELD_NAMES);

      // ----- Client-side checks -----
      // These duplicate the server's rules on purpose: the server is the real
      // guard, this just saves a round trip and points at the right field.
      const amountCents = dollarsToCents(values.amount);

      if (amountCents === null) {
        return {
          values,
          fieldErrors: { amount: 'Enter an amount like 62.00.' },
        };
      }

      if (amountCents <= 0) {
        return { values, fieldErrors: { amount: 'Amount must be greater than zero.' } };
      }

      if (amountCents > MAX_AMOUNT_CENTS) {
        return {
          values,
          fieldErrors: { amount: `Amount must be ${formatCents(MAX_AMOUNT_CENTS)} or less.` },
        };
      }

      if (participantIds.length === 0) {
        return {
          values,
          fieldErrors: { participantIds: 'Pick at least one person to split this between.' },
        };
      }

      // ----- Submit -----
      const body = {
        title: values.title,
        amountCents,
        expenseDate: values.expenseDate,
        paidById: values.paidById,
        participantIds,
        // An empty box means "no description". On an edit that must be null,
        // which CLEARS the column - undefined would leave the old text in
        // place and the deletion would silently not happen.
        description: values.description.trim() ? values.description.trim() : null,
      };

      try {
        if (isEdit) {
          await updateExpense.mutateAsync(body);
        } else {
          await createExpense.mutateAsync(body);
        }

        onClose();

        return { values: initialValues(expense, session?.user?.id) };
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
    { values: initialValues(expense, session?.user?.id) },
  );

  // ----- 3. Live split preview -----
  // Recomputed per render from the amount box and the checked people. Advisory
  // only; the server computes what is actually stored.
  const previewCents = dollarsToCents(amountInput);
  const shares =
    previewCents !== null && previewCents > 0 && participantIds.length > 0
      ? previewSplit(previewCents, participantIds.length)
      : [];

  /** This member's previewed share, or null when there is nothing to preview. */
  function shareFor(userId: string): number | null {
    const index = participantIds.indexOf(userId);
    if (index === -1 || shares.length === 0) return null;
    return shares[index] ?? null;
  }

  function toggleParticipant(userId: string) {
    setParticipantIds((previous) =>
      previous.includes(userId)
        ? previous.filter((id) => id !== userId)
        : // Appended, not inserted - the order decides who absorbs the extra
          // cent, and keeping it stable keeps the preview from jumping around.
          [...previous, userId],
    );
  }

  // ----- 4. Render -----
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Expense' : 'Add Expense'}>
      {/* Resets the uncontrolled inputs when switching between expenses.
          NOTE this does NOT reset useActionState - that hook lives in this
          component, not in the <form>, so a key on the form cannot touch it.
          The real reset is the `key` ExpensesPage puts on this COMPONENT,
          which remounts it on every open. This stays as a second line of
          defence if that key is ever dropped. */}
      <form key={expense?.id ?? 'new'} action={submitAction} className="space-y-4">
        <TextField
          label="Title"
          name="title"
          required
          maxLength={200}
          defaultValue={state.values.title}
          error={state.fieldErrors?.title}
          placeholder="Dinner at Surf n Turf"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {/* type="text", not type="number". A number input lets the user
              scroll the value with the mouse wheel, accepts "1e5", and
              silently formats differently per locale. Money is parsed from a
              string here, deliberately. inputMode="decimal" still gives phones
              the numeric keypad. */}
          <TextField
            label="Amount"
            name="amount"
            required
            inputMode="decimal"
            autoComplete="off"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            error={state.fieldErrors?.amount}
            placeholder="62.00"
            hint="US dollars"
          />

          <DateTimeInput
            label="Date"
            name="expenseDate"
            required
            defaultValue={state.values.expenseDate}
            error={state.fieldErrors?.expenseDate}
          />
        </div>

        {/* A plain <select> rather than a shared component - there is no
            SelectField yet, and one caller does not justify inventing it. If
            reservations or activities need a second, extract it then. */}
        <FormField label="Paid by" required error={state.fieldErrors?.paidById}>
          {({ id, describedBy, invalid }) => (
            <select
              id={id}
              name="paidById"
              required
              defaultValue={state.values.paidById}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={`${controlClasses(invalid)} cursor-pointer`}
            >
              {members.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.displayName}
                  {member.user.id === session?.user?.id ? ' (you)' : ''}
                </option>
              ))}
            </select>
          )}
        </FormField>

        {/* ---------- Split between ---------- */}
        <FormField
          label="Split between"
          required
          error={state.fieldErrors?.participantIds}
          hint="The person who paid does not have to be included."
        >
          {({ describedBy, invalid }) => (
            <div aria-describedby={describedBy}>
              <div className="mb-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setParticipantIds(members.map((member) => member.user.id))}
                  className="cursor-pointer rounded-md border border-ink-300 px-2 py-1 text-xs font-medium text-ink-900 duration-150 hover:bg-ink-100"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setParticipantIds([])}
                  className="cursor-pointer rounded-md border border-ink-300 px-2 py-1 text-xs font-medium text-ink-900 duration-150 hover:bg-ink-100"
                >
                  None
                </button>
              </div>

              <ul
                className={`max-h-56 space-y-2 overflow-y-auto rounded-md border-2 p-2 ${
                  invalid ? 'border-red-400' : 'border-ink-300'
                }`}
              >
                {members.map((member) => {
                  const checked = participantIds.includes(member.user.id);
                  const share = shareFor(member.user.id);

                  return (
                    <li key={member.user.id}>
                      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 duration-150 hover:bg-ink-100">
                        <span className="flex min-w-0 items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleParticipant(member.user.id)}
                            className="cursor-pointer"
                          />
                          <span className="truncate text-sm text-ink-900">
                            {member.user.displayName}
                            {member.user.id === session?.user?.id && (
                              <span className="ml-2 text-xs font-medium text-brand-600">You</span>
                            )}
                          </span>
                        </span>

                        {/* The live preview. This is the only place anyone
                            sees that a remainder is distributed a cent at a
                            time rather than rounded. */}
                        {share !== null && (
                          <span className="shrink-0 text-sm font-medium text-ink-900 tabular-nums">
                            {formatCents(share)}
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>

              {shares.length > 0 && (
                <p className="mt-1 text-xs text-ink-700">
                  {formatCents(previewCents ?? 0)} split {shares.length}{' '}
                  {shares.length === 1 ? 'way' : 'ways'}. The server computes the final shares.
                </p>
              )}
            </div>
          )}
        </FormField>

        <TextArea
          label="Description"
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={state.values.description}
          error={state.fieldErrors?.description}
          placeholder="Anything worth remembering about this expense"
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
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
