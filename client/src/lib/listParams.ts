/**
 * FILE: listParams.ts
 * DESCRIPTION: Helpers for list pages whose state lives in the URL.
 *
 *              `unpackSort` was written inline in MyTripsPage first. This is
 *              its second caller and two more lists are coming, so it moves
 *              here rather than being copied four times - four copies is four
 *              chances for one of them to disagree about what a malformed
 *              value should fall back to.
 *
 * LAST UPDATED: 2026-11-02 - File Created (Josh Iehle)
 */

// -------------------- Types --------------------

export interface UnpackedSort {
  sort: string;
  order: string;
}

// -------------------- Sort --------------------

/**
 * Unpacks "expenseDate:desc" into the two params the API takes.
 *
 * Sort and direction are ONE dropdown in the UI but TWO query params on the
 * server, so the option value packs both and is split on use.
 *
 * The fallbacks are not defensive padding. `split` is an indexed read, so
 * under noUncheckedIndexedAccess both halves are possibly undefined, and a
 * hand-edited URL really can contain `?sort=nonsense`. Falling back to this
 * list's default beats sending `undefined` and getting a 422 on a page the
 * user only wanted to look at.
 */
export function unpackSort(
  packed: string,
  fallbackSort: string,
  fallbackOrder: 'asc' | 'desc',
): UnpackedSort {
  const [sort = fallbackSort, order = fallbackOrder] = packed.split(':');
  return { sort, order };
}
