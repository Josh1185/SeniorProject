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
 *              TWO TAILWIND v4 COLLISIONS TO KNOW ABOUT (both fixed below):
 *
 *              1. Preflight resets `margin: 0` on every element, including
 *                 ::backdrop. The browser centres a modal dialog with
 *                 `inset: 0` + `margin: auto`, so that reset pins the dialog
 *                 to the top-left corner. `m-auto` puts the centring back.
 *
 *              2. A closed dialog is hidden by the UA rule
 *                 `dialog:not([open]) { display: none }`. Any author-origin
 *                 display utility - `flex`, `block`, `grid` - outranks that
 *                 rule, so the dialog stays laid out on screen after close().
 *                 The display utility must be gated on the open state:
 *                 `hidden flex-col open:flex`.
 *
 *              RESPONSIVE: a centred card on desktop, a full-screen sheet on
 *              mobile. The mobile variant works by removing the max-width and
 *              the rounding rather than by repositioning anything.
 *
 * LAST UPDATED: 2026-10-13 - Fix centring and closed-state display (Josh Iehle)
 *               2026-10-13 - Full-screen on mobile, scrollable body (Josh Iehle)
 *               2026-10-11 - File Created (Josh Iehle)
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
  //
  // On mobile the dialog fills the viewport, so there is no backdrop to hit -
  // which is correct, a full-screen sheet should close via its own control.
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
      className={[
        // DISPLAY. `hidden` lets the closed dialog actually disappear;
        // `open:flex` turns the layout on only while [open] is present.
        // flex-col is listed unconditionally because it does nothing until
        // something sets display: flex.
        'hidden flex-col open:flex',

        // CENTRING.
        'm-auto',

        // Shared chrome.
        'border border-ink-300 bg-ink-50 p-0 text-ink-900 backdrop:bg-ink-900/45',

        // Mobile: full-screen sheet. max-w-none overrides the browser's
        // default `max-width: calc(100% - 12px)`, and h-dvh uses the DYNAMIC
        // viewport height so the sheet is not cut off by Safari's address bar.
        'h-dvh max-h-dvh w-full max-w-none rounded-none',

        // Desktop: a centred card that only grows as tall as it needs to.
        'sm:h-min sm:max-h-[85vh] sm:w-full sm:max-w-md sm:rounded-xl sm:shadow-xl',
      ].join(' ')}
    >
      {/* shrink-0 stops the header collapsing when the body is tall. */}
      <div className="flex shrink-0 items-center justify-between border-b border-ink-300 px-6 py-4">
        <h2 id="modal-title" className="text-lg font-semibold text-ink-900">
          {title}
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="cursor-pointer rounded-md p-1 text-ink-700 duration-150 hover:bg-ink-100 hover:text-ink-900"
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

      {/* overflow-y-auto on the BODY, not the dialog, so a long form scrolls
          under a fixed header rather than scrolling the title out of view. */}
      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
    </dialog>
  );
}
