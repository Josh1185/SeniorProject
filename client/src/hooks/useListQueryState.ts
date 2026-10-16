/**
 * FILE: useListQueryState.ts
 * DESCRIPTION: Search / filter / sort state for a list page, stored in the URL.
 *
 *              WHY THE URL AND NOT useState: `?search=orlando` survives a
 *              refresh, works with the back button, and can be pasted to a
 *              teammate. Local state does none of that, and every list in this
 *              app wants all three.
 *
 *              USAGE - declare every param and its default at MODULE scope:
 *
 *                const TRIP_LIST_DEFAULTS = {
 *                  search: '',
 *                  status: '',
 *                  role: '',
 *                  sort: 'startDate:asc',
 *                };
 *
 *                const list = useListQueryState({ defaults: TRIP_LIST_DEFAULTS });
 *
 *                list.values.status          // committed value, safe in a query key
 *                list.setValue('status', v)  // writes the URL
 *                list.searchInput            // bind this to the search box
 *                list.setSearchInput(v)      // instant, debounced into the URL
 *                list.isFiltered             // any filter active? (ignores sort)
 *                list.reset()                // clear every param back to default
 *
 *              `search` and `sort` are REQUIRED keys - the type enforces it -
 *              because every list in this app has a search box and a sort
 *              dropdown. Everything else in `defaults` is an arbitrary filter.
 *
 *              TWO RULES THIS HOOK ENFORCES SO YOU DO NOT HAVE TO:
 *
 *              1. A param equal to its default is REMOVED from the URL rather
 *                 than written as `?status=`. The address bar stays readable
 *                 and the default lives in exactly one place - the defaults
 *                 object - instead of being duplicated as a magic string in
 *                 the query string.
 *
 *              2. The search box is local state, debounced into the URL.
 *                 Writing a param per keystroke pushes a history entry per
 *                 keystroke, so the back button has to be pressed nine times
 *                 to escape "orlando", and it refetches nine times on the way.
 *
 *              DELIBERATELY NOT CONFIGURABLE, until something needs it:
 *                - a param prefix, for two independent lists on one page
 *                - which key the search box drives
 *                - unpacking `sort` - the page splits "startDate:asc" itself,
 *                  because that packing is a ListToolbar convention rather
 *                  than something this hook should know about
 *
 *              NOT IN HERE: pagination. No list in this app is paginated yet.
 *              When one is, add `page` to defaults and reset it to '1' inside
 *              setValue whenever a filter changes - a filtered list that stays
 *              on page 7 shows an empty page.
 *
 * LAST UPDATED: 2026-10-16 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

// -------------------- Hook imports --------------------
import { useDebouncedValue } from './useDebouncedValue';

// -------------------- Types --------------------

/**
 * Every list has these two. The rest of `defaults` is filters.
 *
 * The `Record<string, string>` half matters: every value must be a string,
 * because every value is going into a query string. Without it, a defaults
 * object containing `page: 1` would compile at the call site and fail with a
 * confusing error inside this file instead.
 */
type RequiredDefaults = Record<string, string> & {
  search: string;
  sort: string;
};

interface UseListQueryStateOptions<D extends RequiredDefaults> {
  /**
   * Every param this list owns, mapped to its default value. The keys are the
   * query-string keys, and the shape of `values` is derived from this object -
   * so `values.status` type-checks and `values.staus` does not.
   */
  defaults: D;
  /** How long to wait after the last keystroke before writing the URL. */
  debounceMs?: number;
}

interface UseListQueryStateResult<D extends RequiredDefaults> {
  /** Current value of every declared param. Never undefined - defaults fill in. */
  values: { [K in keyof D]: string };
  /** Writes one param. Clears it from the URL when it equals its default. */
  setValue: (key: keyof D & string, value: string) => void;
  /** What the user has typed. Bind this to the search input's `value`. */
  searchInput: string;
  setSearchInput: (value: string) => void;
  /** Any param other than `sort` differs from its default. */
  isFiltered: boolean;
  /** Clears every param this list owns, leaving any others on the URL alone. */
  reset: () => void;
}

// -------------------- Hook --------------------
export function useListQueryState<D extends RequiredDefaults>({
  defaults,
  debounceMs = 350,
}: UseListQueryStateOptions<D>): UseListQueryStateResult<D> {
  const [searchParams, setSearchParams] = useSearchParams();

  // ----- 1. Freeze the defaults -----
  // Declaring the defaults at module scope is the documented way to call this,
  // but an inline object literal would be a NEW reference on every render -
  // which would rebuild setValue and re-run the search effect every single
  // time. The defaults are a declaration, not state: they never change, so the
  // first one wins and a caller cannot accidentally create that churn.
  //
  // useState WITHOUT a setter, not useRef. A ref holds values that live outside
  // rendering - a DOM node, a timer id - and reading one during render makes
  // the output depend on something React does not track, which is what the
  // `react-hooks/refs` lint rule is there to catch. useState's initialiser runs
  // exactly once per instance and the value is a normal, safe thing to read
  // while rendering. The missing setter is the point: nothing can change it.
  const [frozen] = useState(defaults);

  // Every declared key, in declaration order. Frozen for the same reason, and
  // the lazy initialiser means Object.keys runs once rather than per render.
  const [keys] = useState(() => Object.keys(defaults) as (keyof D & string)[]);

  // ----- 2. Read every declared param out of the URL -----
  // Built as a plain Record and asserted once at the end. A generic mapped
  // type like `{ [K in keyof D]: string }` is read-only as far as TypeScript is
  // concerned - it cannot verify that a loop assigns every key - so writing to
  // it directly is an error. Collecting into a Record and asserting once is
  // the honest version of that: the loop covers every key of D by construction.
  const collected: Record<string, string> = {};

  for (const key of keys) {
    collected[key] = searchParams.get(key) ?? frozen[key];
  }

  const values = collected as { [K in keyof D]: string };

  // ----- 3. Write one param -----
  const setValue = useCallback(
    (key: keyof D & string, value: string) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);

        // Equal to the default means "not set". Writing it anyway would put
        // `?status=` in the address bar and make a pristine list look filtered.
        if (value && value !== frozen[key]) next.set(key, value);
        else next.delete(key);

        return next;
      });
    },
    [setSearchParams, frozen],
  );

  // ----- 4. The search box -----
  const committedSearch = values.search;

  const [searchInput, setSearchInput] = useState(committedSearch);
  const debouncedSearch = useDebouncedValue(searchInput, debounceMs);

  // Re-sync when the URL changes from the OUTSIDE - the back button, reset(), a
  // pasted link. Adjusting state during render rather than in an effect means
  // no extra paint showing the stale value first.
  const [lastCommitted, setLastCommitted] = useState(committedSearch);

  if (committedSearch !== lastCommitted) {
    setLastCommitted(committedSearch);
    setSearchInput(committedSearch);
  }

  useEffect(() => {
    // Still typing - the debounced value has not caught up yet.
    if (debouncedSearch !== searchInput) return;

    // The URL already agrees. Without this guard the effect writes the same
    // value back, which re-renders, which runs the effect again.
    if (searchInput === committedSearch) return;

    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);

        if (searchInput && searchInput !== frozen.search) next.set('search', searchInput);
        else next.delete('search');

        return next;
      },
      // replace, not push: typing should not bury the previous page under one
      // history entry per character.
      { replace: true },
    );
  }, [debouncedSearch, searchInput, committedSearch, frozen, setSearchParams]);

  // ----- 5. Derived flags -----
  // `sort` is excluded because sorting a list is not filtering it - a list
  // sorted Z-A with no filters should still say "No trips yet", not "nothing
  // matches your filters".
  const isFiltered = keys.some((key) => key !== 'sort' && values[key] !== frozen[key]);

  // ----- 6. Reset -----
  const reset = useCallback(() => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);

      // Only this list's params. An unrelated param - a `?tab=` the page also
      // uses - must survive, which is why this is not setSearchParams({}).
      for (const key of keys) next.delete(key);

      return next;
    });
  }, [setSearchParams, keys]);

  return { values, setValue, searchInput, setSearchInput, isFiltered, reset };
}
