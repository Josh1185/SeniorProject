/**
 * FILE: MyTripsPage.tsx
 * DESCRIPTION: The trip list
 *
 *              The Create Trip button opens the modal now so the wiring is
 *              proven; the form inside it is F7's job.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useState } from 'react';

// -------------------- Component imports --------------------
import { Modal } from '../../components/Modal';

// -------------------- Component --------------------
export function MyTripsPage() {
  // ----- 1. State management -----
  const [createOpen, setCreateOpen] = useState(false);

  // ----- 2. Render -----
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search trips…"
          className="min-w-0 flex-1 rounded-md border border-ink-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 cursor-pointer duration-150"
        >
          Create Trip
        </button>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-ink-300 p-12 text-center">
        <p className="text-ink-900">The trip list goes here.</p>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Trip">
        <p className="text-sm text-ink-900">The create-trip form goes here.</p>
      </Modal>
    </div>
  );
}
