/**
 * FILE: InviteFormModal.tsx
 * DESCRIPTION: Invites someone to a trip, then hands back the link to send
 *              them.
 *
 *              TWO STEPS IN ONE MODAL, which is unusual for this codebase and
 *              deliberate. We do not send email - the invitation IS a link,
 *              and a link nobody copied has accomplished nothing. Closing on
 *              success would create an invitation and then hide the only
 *              useful thing about it, leaving the owner to hunt for a copy
 *              button in a list they were not looking at.
 *
 *              So: form, then the link, then done.
 *
 * LAST UPDATED: 2026-11-16 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { FormState } from '../../lib/formState';
import type { TripInvitation } from '../../types/api';

// -------------------- Module and lib imports --------------------
import { useActionState, useState } from 'react';
import { buildInviteUrl, describeExpiry } from '../../lib/invitations';
import { readFormValues } from '../../lib/formState';

// -------------------- Hook imports --------------------
import { useCreateInvitation } from '../../hooks/invitations/useCreateInvitation';

// -------------------- Component imports --------------------
import { Modal } from '../Modal';
import { TextField } from '../form/TextField';

// -------------------- Props interface --------------------
interface InviteFormModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string | undefined;
  tripName: string;
}

// -------------------- Form Values --------------------

const FIELD_NAMES = ['email'] as const;

type InviteFormValues = Record<(typeof FIELD_NAMES)[number], string>;

const EMPTY_VALUES: InviteFormValues = { email: '' };

// -------------------- Internal Components --------------------

/**
 * The link, with a button that copies it.
 *
 * The input is readonly and always on screen rather than hidden behind the
 * button, because navigator.clipboard can fail - it needs a secure context and
 * a recent user gesture, and a browser can refuse for reasons the page cannot
 * see. When it does, the link is still right there to select by hand.
 */
function CopyableLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Not an error worth a red box - the link is visible and selectable.
      setFailed(true);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={url}
          // Selects the whole link on click, so copying by hand is one
          // gesture rather than a careful drag.
          onFocus={(event) => event.currentTarget.select()}
          className="min-w-0 flex-1 rounded-md border-2 border-ink-300 bg-ink-100 px-3 py-2 font-mono text-xs text-ink-900"
        />

        <button
          type="button"
          onClick={() => void copy()}
          className="shrink-0 cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-brand-700"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {failed && (
        <p className="mt-1 text-xs text-ink-700">
          Your browser blocked the copy. Select the link above and copy it manually.
        </p>
      )}
    </div>
  );
}

// -------------------- Component --------------------
export function InviteFormModal({ open, onClose, tripId, tripName }: InviteFormModalProps) {
  /**
   * The invitation just created, or null while the form is showing.
   *
   * This is what switches the modal between its two steps.
   */
  const [created, setCreated] = useState<TripInvitation | null>(null);

  const createInvitation = useCreateInvitation(tripId ?? '');

  // ----- Submit action -----
  const [state, submitAction, isPending] = useActionState(
    async (
      _previous: FormState<InviteFormValues>,
      formData: FormData,
    ): Promise<FormState<InviteFormValues>> => {
      const values = readFormValues(formData, FIELD_NAMES);

      try {
        const response = await createInvitation.mutateAsync({ email: values.email });

        // Does NOT call onClose. Showing the link is the second half of this
        // modal's job.
        setCreated(response.invitation);

        return { values: EMPTY_VALUES };
      } catch (mutationError) {
        // The server's message is the useful one here: "already a member of
        // this trip" and "already a pending invitation" are both things the
        // owner needs to read, and neither is something the client could have
        // known to check.
        return {
          values,
          formError:
            mutationError instanceof Error ? mutationError.message : 'Something went wrong.',
        };
      }
    },
    { values: EMPTY_VALUES },
  );

  /** Back to a blank form, for inviting a second person without reopening. */
  function inviteAnother() {
    setCreated(null);
  }

  function handleClose() {
    setCreated(null);
    onClose();
  }

  // ----- Render -----
  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={created ? 'Invitation created' : 'Invite to this trip'}
    >
      {created ? (
        // ---------- Step 2: the link ----------
        <div className="space-y-4">
          <p className="text-sm text-ink-900">
            Send this link to <span className="font-medium">{created.email}</span>. Anyone who
            opens it can join <span className="font-medium">{tripName}</span>.
          </p>

          <CopyableLink url={buildInviteUrl(created.token)} />

          {/* Said plainly rather than implied. The token is the whole
              authorization - there is no check that the person who opens the
              link is the person it was addressed to - so an owner forwarding
              it into a group chat should know what they are doing. */}
          <p className="text-xs text-ink-700">
            The link works for whoever opens it, not just this address.{' '}
            {describeExpiry(created.expiresAt).toLowerCase()}. You can revoke it at any time from
            the invitations list.
          </p>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={inviteAnother}
              className="cursor-pointer rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 duration-150 hover:bg-ink-100"
            >
              Invite someone else
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-brand-700"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        // ---------- Step 1: the form ----------
        <form action={submitAction} className="space-y-4">
          <TextField
            label="Email address"
            name="email"
            type="email"
            required
            autoComplete="off"
            maxLength={254}
            defaultValue={state.values.email}
            error={state.fieldErrors?.email}
            placeholder="name@example.com"
            hint="They do not need a TripSquad account yet."
          />

          {state.formError && (
            <p role="alert" className="text-sm text-red-600">
              {state.formError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="cursor-pointer rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 duration-150 hover:bg-ink-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white duration-150 hover:bg-brand-700 disabled:opacity-50"
            >
              {isPending ? 'Creating…' : 'Create invite link'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
