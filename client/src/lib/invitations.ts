/**
 * FILE: invitations.ts
 * DESCRIPTION: Turning an invitation into the two things a person sees: the
 *              link they paste, and how long they have to use it.
 *
 *              Both are pure and both take their environment as a parameter -
 *              the origin, the clock - which is the only reason they can be
 *              tested. A function that reads window.location or new Date()
 *              itself can only be tested by being in a browser, or by waiting.
 *
 * LAST UPDATED: 2026-11-16 - File Created (Josh Iehle)
 */

// -------------------- Constants --------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// -------------------- The link --------------------

/**
 * The URL an owner copies and sends.
 *
 * The origin is a parameter with a window fallback rather than read directly,
 * so this works under the node test environment and so a preview deployment
 * produces links to itself rather than to production.
 */
export function buildInviteUrl(
  token: string,
  origin: string = typeof window === 'undefined' ? '' : window.location.origin,
): string {
  // base64url contains nothing that needs escaping, so this is belt and
  // braces - but a token that ever changes shape should not silently produce
  // a broken URL.
  return `${origin}/invite/${encodeURIComponent(token)}`;
}

// -------------------- The deadline --------------------

/** Local midnight on the day of `date`. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * "Expires in 11 days", for an invitation list.
 *
 * Two different comparisons on purpose, and the difference matters:
 *
 *   - whether it has EXPIRED is an exact timestamp comparison, because an
 *     invitation that lapsed at 2pm is dead at 3pm, not at midnight
 *   - how long is LEFT is counted in calendar days, because that is how a
 *     person reads a deadline. An invitation expiring at 2am tomorrow is
 *     "tomorrow", not "in 0 days"
 */
export function describeExpiry(expiresAt: string, now: Date = new Date()): string {
  const expires = new Date(expiresAt);

  if (Number.isNaN(expires.getTime())) return '';

  if (expires.getTime() <= now.getTime()) return 'Expired';

  const days = Math.round(
    (startOfDay(expires).getTime() - startOfDay(now).getTime()) / MS_PER_DAY,
  );

  if (days <= 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';

  return `Expires in ${days} days`;
}
