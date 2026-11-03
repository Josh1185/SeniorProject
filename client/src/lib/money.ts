/**
 * FILE: money.ts
 * DESCRIPTION: Turning what a person types into integer cents, and back.
 *
 *              The whole codebase stores money as integer cents. A form takes
 *              dollars. This file is the only place that crosses between the
 *              two, and it does it with string arithmetic rather than
 *              floating-point maths.
 *
 *              WHY NOT parseFloat(value) * 100:
 *
 *                "19.99" -> 1998.9999999999998
 *                "2.03"  -> 202.99999999999997
 *                "8.21"  -> 821.0000000000001
 *
 *              Math.round() hides most of those, but it also turns "1.005"
 *              into 100 - a cent lost, silently, in the one place the
 *              application promises not to lose cents. Splitting the string on
 *              its decimal point and doing integer arithmetic has no such
 *              cases.
 *
 * LAST UPDATED: 2026-11-02 - File Created (Josh Iehle)
 */

// -------------------- Constants --------------------

/**
 * The largest value a Postgres Int holds: 2^31 - 1, about $21.4 million.
 * Mirrors MAX_AMOUNT_CENTS in server/src/schemas/expenseSchemas.ts.
 */
export const MAX_AMOUNT_CENTS = 2_147_483_647;

// -------------------- Parsing --------------------

/**
 * "$1,234.56" -> 123456. Returns null when the input is not a plain amount.
 *
 * Accepts: "62", "62.", "62.5", "62.50", ".50", "$62.00", "1,234.56", and the
 * same with surrounding whitespace.
 *
 * Rejects: negatives, three or more decimal places, exponents, anything with
 * a letter, and - deliberately - anything with whitespace INSIDE it. Only the
 * ends are trimmed. Stripping internal spaces would read "62 00" as 6200
 * dollars rather than rejecting it, and quietly inflating an expense a
 * hundredfold is exactly the failure this function exists to prevent.
 *
 * Three decimal places are rejected rather than rounded. "1.005" could mean
 * $1.00 or $1.01, this function cannot know which, and guessing on money is
 * worse than asking.
 */
export function dollarsToCents(input: string): number | null {
  const cleaned = input.trim().replace(/[$,]/g, '');
  if (cleaned === '') return null;

  // Optional whole part, optional decimal point, at most two decimal places.
  const match = /^(\d*)(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!match) return null;

  const [, whole = '', fraction = ''] = match;

  // "." and "" both reach here with nothing on either side.
  if (whole === '' && fraction === '') return null;

  const dollars = whole === '' ? 0 : Number(whole);
  if (!Number.isSafeInteger(dollars)) return null;

  // padEnd, not parseInt: "5" after a decimal point means fifty cents, not five.
  const cents = Number(fraction.padEnd(2, '0') || '0');

  return dollars * 100 + cents;
}

/**
 * 6200 -> "62.00". The value an <input> is prefilled with when editing.
 *
 * Exact for every value up to MAX_AMOUNT_CENTS: dividing by 100 and fixing to
 * two places round-trips back through dollarsToCents without drift.
 */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

// -------------------- Splitting --------------------

/**
 * How an amount divides between `count` people, as a preview.
 *
 * ⚠ THIS IS A SECOND IMPLEMENTATION OF server/src/utils/money.ts. The SERVER
 * is authoritative - it computes and stores the real shares, and this never
 * leaves the browser. It exists so the form can show what a split will look
 * like before it is submitted, which is the clearest way to make the
 * remainder distribution visible rather than surprising.
 *
 * If one of the two ever changes, change BOTH. The honest fix is a shared
 * workspace package that client and server both import; that is worth doing
 * if a third copy is ever needed, and not before.
 *
 * Returns amounts only, not user ids - the caller knows who is in the list and
 * the order matches.
 */
export function previewSplit(amountCents: number, count: number): number[] {
  if (count <= 0) return [];

  const base = Math.floor(amountCents / count);
  const remainder = amountCents - base * count;

  // The first `remainder` people pay one cent more. Same rule as the server,
  // so the preview matches what is actually stored.
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}
