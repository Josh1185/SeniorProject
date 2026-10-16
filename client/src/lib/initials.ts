/**
 * FILE: initials.ts
 * DESCRIPTION: Turns a display name into the letters that stand in for a
 *              profile picture.
 *
 *              A .ts file rather than part of Avatar.tsx because of the
 *              `react-refresh/only-export-components` rule - a .tsx module that
 *              exports a non-component cannot be hot-swapped.
 *
 * LAST UPDATED: 2026-10-16 - File Created (Josh Iehle)
 */

// -------------------- Initials --------------------

/**
 * "Josh Iehle" -> "JI". One word gives one letter.
 *
 * Returns "?" for an empty name rather than an empty string, because a blank
 * circle reads as a loading state - and the name really can be empty for a
 * moment while the /users/me query is in flight.
 *
 * `part[0]` is an index, so under noUncheckedIndexedAccess it is possibly
 * undefined even though filter(Boolean) removed the empty strings. The `?? ''`
 * is what satisfies that, not defensiveness for its own sake.
 */
export function getInitials(displayName: string): string {
  const letters = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return letters || '?';
}
