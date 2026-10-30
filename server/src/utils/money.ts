/**
 * FILE: money.ts
 * DESCRIPTION: Money arithmetic. Every amount in TripSquad is an integer
 *              number of cents, and this file is the only place that divides
 *              one.
 *
 *              WHY THIS FILE EXISTS: the Expense model carries an invariant
 *              the database cannot enforce - the sum of an expense's
 *              participant shares must equal its amountCents, exactly. If
 *              splitting lived inline in the controller AND in the seed
 *              script, the two would eventually disagree and balances would
 *              stop reconciling with no single place to look. One function,
 *              one unit test, two callers.
 *
 * LAST UPDATED: 2026-10-20 - File Created (Josh Iehle)
 */

// -------------------- Types --------------------

export interface ExpenseShare {
  userId: string;
  shareCents: number;
}

// -------------------- Splitting --------------------

/**
 * Divides an amount between participants as evenly as integer cents allow.
 *
 * The remainder is distributed ONE CENT AT A TIME to the first participants,
 * never rounded. $62.00 between three people is 2067 / 2067 / 2066, which
 * sums to exactly 6200.
 *
 * Rounding each share instead - 6200 / 3 = 2066.67, rounded to 2067 each -
 * would produce 6201 and quietly invent a cent. Over a trip's worth of
 * expenses those invented cents are why a settlement screen fails to
 * reconcile, and the cause is almost impossible to find after the fact.
 *
 * Which participants get the extra cent is decided by INPUT ORDER, so the
 * same list always produces the same split. It is one cent; the property
 * that matters is the sum, and that is what the tests assert.
 */
export function splitEqually(amountCents: number, userIds: string[]): ExpenseShare[] {
  if (!Number.isInteger(amountCents)) {
    throw new Error(`splitEqually expects integer cents, received ${amountCents}`);
  }

  if (amountCents < 0) {
    throw new Error(`splitEqually expects a non-negative amount, received ${amountCents}`);
  }

  if (userIds.length === 0) {
    // Dividing by zero would give Infinity and write nonsense to the database.
    // An expense split between nobody is a client bug, so fail loudly.
    throw new Error('splitEqually requires at least one participant');
  }

  // Math.floor, not Math.round. Every share starts at or below the true
  // average, so the remainder is always non-negative and always smaller than
  // the participant count - which is what makes the loop below terminate with
  // an exact total.
  const base = Math.floor(amountCents / userIds.length);
  const remainder = amountCents - base * userIds.length;

  return userIds.map((userId, index) => ({
    userId,
    // The first `remainder` participants pay one cent more than the rest.
    shareCents: base + (index < remainder ? 1 : 0),
  }));
}

/**
 * Total of a set of shares. Exists so the invariant can be asserted in one
 * readable line in tests and in the .http checklist.
 */
export function sumShares(shares: ExpenseShare[]): number {
  return shares.reduce((total, share) => total + share.shareCents, 0);
}

// -------------------- Formatting --------------------

/**
 * 1250 -> "$12.50". Takes CENTS, always.
 *
 * Server-side only; the client has its own formatCents. This one is for log
 * messages and error text, where a raw 1250 is unreadable.
 */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
