/**
 * FILE: ConfirmDialog.tsx
 * DESCRIPTION: Confirmation before a destructive action.
 *
 *              Separate from Modal because the shape is fixed: a message and
 *              two buttons. Every delete in the app should use this rather
 *              than window.confirm, which cannot be styled and blocks the
 *              whole tab.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Component imports --------------------
import { Modal } from './Modal';

// -------------------- Prop Interface --------------------
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  pending?: boolean;
}

// -------------------- Component --------------------
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  pending = false,
}: ConfirmDialogProps) {

  // ----- 1. Render -----
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-ink-900">{description}</p>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="cursor-pointer rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 duration-150 hover:bg-ink-100 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => void onConfirm()}
          disabled={pending}
          className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white duration-150 disabled:opacity-50 ${
            destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'
          }`}
        >
          {pending ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
