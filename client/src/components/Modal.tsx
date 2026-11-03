/**
 * FILE: Modal.tsx
 * DESCRIPTION: Reusable modal dialog.
 *
 *              Built on the native <dialog> element rather than a hand-rolled
 *              fixed-position overlay. showModal() gives us, for free:
 *                - focus trapped inside the dialog
 *                - Escape closes it
 *                - the rest of the page marked inert for screen readers
 *                - a ::backdrop pseudo-element to dim behind it
 *
 *              THREE THINGS HERE ARE NON-OBVIOUS AND ALL THREE ARE LOad-BEARING:
 *
 *              1. TAILWIND v4 ZEROES MARGINS, including on ::backdrop. The
 *                 browser centres a modal dialog with `inset: 0` + `margin:
 *                 auto`, so Preflight's reset pins it to the top-left corner.
 *                 `m-auto` puts the centring back.
 *
 *              2. A CLOSED DIALOG IS HIDDEN BY `dialog:not([open])`, a UA
 *                 rule. Any author-origin display utility - `flex`, `block` -
 *                 outranks it, so the dialog stays laid out after close(). The
 *                 display utility is therefore gated: `hidden flex-col
 *                 open:flex`.
 *
 *              3. THE NATIVE `close` EVENT FIRES FOR BOTH KINDS OF CLOSE - the
 *                 user pressing Escape, AND this component calling close()
 *                 because its `open` prop went false. Reporting the second
 *                 one back to the parent as "the user closed me" breaks every
 *                 transition from one dialog to another: the parent sets
 *                 state to open dialog B, this one closes, its close event
 *                 fires, the parent resets state, and B shuts again about a
 *                 frame after it opened. See `weClosedIt` below.
 *
 * LAST UPDATED: 2026-11-02 - Do not report our own close() to the parent (Josh Iehle)
 *               2026-10-13 - Fix centring and closed-state display (Josh Iehle)
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

  /**
   * True for the brief moment between us calling close() and the resulting
   * close event arriving.
   *
   * A ref rather than state because nothing renders from it, and because it
   * has to be readable by an event handler without waiting for a re-render.
   *
   * It cannot get stuck: it is only ever set immediately before a close() on
   * a dialog that is actually open, and close() on an open dialog always
   * fires exactly one close event, which clears it.
   */
  const weClosedIt = useRef(false);

  /** Closes the dialog without the close event being reported to the parent. */
  function closeQuietly(dialog: HTMLDialogElement) {
    weClosedIt.current = true;
    dialog.close();
  }

  // ----- 1. Keep the DOM element in sync with the `open` prop -----
  // <dialog> is imperative: it opens via showModal(), not an attribute. This
  // effect is the bridge between React's declarative prop and that API.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // The `dialog.open` checks matter: calling showModal() on an already-open
    // dialog throws, and close() on a closed one fires a stray close event.
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) closeQuietly(dialog);
  }, [open]);

  // ----- 2. Close on unmount -----
  // A parent that unmounts an open modal - swapping `key` to switch between
  // two records, for instance - would otherwise leave a dialog in the browser's
  // top layer with nothing rendering it.
  useEffect(() => {
    const dialog = dialogRef.current;

    return () => {
      if (dialog?.open) closeQuietly(dialog);
    };
  }, []);

  // ----- 3. The native close event -----
  function handleNativeClose() {
    // Our own close(), not the user's. Swallow it: the parent already knows,
    // it is what set `open` to false in the first place.
    if (weClosedIt.current) {
      weClosedIt.current = false;
      return;
    }

    // A real user close - Escape, or the backdrop handler below.
    onClose();
  }

  // ----- 4. Close on backdrop click -----
  // The backdrop is not a separate element, so there is no onClick to attach
  // to it. The trick: a click on the backdrop reports the <dialog> itself as
  // the target, whereas a click on the content reports a child.
  //
  // On mobile the dialog fills the viewport, so there is no backdrop to hit -
  // which is correct, a full-screen sheet should close via its own control.
  function handleClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose();
  }

  // ----- 5. Render -----
  return (
    <dialog
      ref={dialogRef}
      onClose={handleNativeClose}
      onClick={handleClick}
      aria-labelledby="modal-title"
      className={[
        // DISPLAY. `hidden` lets the closed dialog actually disappear;
        // `open:flex` turns the layout on only while [open] is present.
        'hidden flex-col open:flex',

        // CENTRING. Restores the `margin: auto` that Preflight stripped.
        'm-auto',

        // Shared chrome.
        'border border-ink-300 bg-ink-50 p-0 text-ink-900 backdrop:bg-ink-900/45',

        // Mobile: full-screen sheet. max-w-none overrides the browser's
        // default `max-width: calc(100% - 12px)`, and h-dvh uses the DYNAMIC
        // viewport height so the sheet is not cut off by Safari's address bar.
        'h-dvh max-h-dvh w-full max-w-none rounded-none',

        // Desktop: a centred card that only grows as tall as it needs to.
        'sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-md sm:rounded-xl sm:shadow-xl',
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
