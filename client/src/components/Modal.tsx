/**
 * FILE: Modal.tsx
 * DESCRIPTION: Reusable modal dialog. Used by Create Trip now, and by every
 *              create/edit form the feature modules add later.
 *
 *              Built on the native <dialog> element rather than a hand-rolled
 *              fixed-position overlay. showModal() gives us, for free:
 *                - focus trapped inside the dialog
 *                - Escape closes it
 *                - the rest of the page marked inert for screen readers
 *                - a ::backdrop pseudo-element to dim behind it
 *
 *              Reimplementing that correctly is a surprising amount of code,
 *              and most hand-rolled versions skip the focus trap entirely.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ReactNode } from 'react';

// -------------------- Module and lib imports --------------------
import { useEffect, useRef } from 'react';

// -------------------- Props interface --------------------
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// -------------------- Component --------------------
export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // ----- 1. Keep the DOM element in sync with the `open` prop -----
  // <dialog> is imperative: it opens via showModal(), not an attribute. This
  // effect is the bridge between React's declarative prop and that API.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // The `dialog.open` checks matter: calling showModal() on an already-open
    // dialog throws, and close() on a closed one fires a stray close event.
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // ----- 2. Close on backdrop click -----
  // The backdrop is not a separate element, so there is no onClick to attach
  // to it. The trick: a click on the backdrop reports the <dialog> itself as
  // the target, whereas a click on the content reports a child.
  function handleClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose();
  }

  // ----- 3. Render -----
  return (
    <dialog
      ref={dialogRef}
      // Fires when the browser closes the dialog, including on Escape. This
      // is what keeps React state in sync when the user does not click our
      // own close button.
      onClose={onClose}
      onClick={handleClick}
      aria-labelledby="modal-title"
      className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/45"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
          {title}
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
