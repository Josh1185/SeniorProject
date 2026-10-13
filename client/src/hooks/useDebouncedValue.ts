/**
 * FILE: useDebouncedValue.ts
 * DESCRIPTION: Returns a value that only updates after it has stopped
 *              changing for `delay` milliseconds.
 *
 *              Used by the search box and the destination autocomplete so we
 *              fire one request per pause rather than one per keystroke.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { useEffect, useState } from 'react';

// -------------------- Hook --------------------
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    // Clearing on every change is the whole mechanism: a new keystroke
    // cancels the pending timer, so only the last one in a burst survives.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
