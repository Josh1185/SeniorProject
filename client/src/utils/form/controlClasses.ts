/**
 * FILE: controlClasses.ts
 * DESCRIPTION:
 *
 * LAST UPDATED: 2026-10-15 - File Created (Josh Iehle)
 */

// -------------------- Shared control styling --------------------

/**
 * The input/select/textarea class string, in one place so a text field and a
 * date field cannot drift apart visually.
 *
 * Exported rather than kept private because LocationPicker's search box is a
 * bare <input> that still has to look like every other control.
 */
export function controlClasses(invalid: boolean): string {
  return [
    'w-full rounded-md border-2 bg-ink-100 px-3 py-2 text-ink-900',
    'duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500',
    invalid ? 'border-red-400' : 'border-ink-300',
    'disabled:opacity-50',
  ].join(' ');
}
