/**
 * FILE: tripStatus.ts
 * DESCRIPTION: Derives a trip's status from its dates.
 *
 *              Status is NOT stored in the database. Storing it would need a
 *              scheduled job to flip UPCOMING -> ACTIVE -> COMPLETED as dates
 *              pass, and the row would be wrong in between runs. Deriving it on
 *              read is always correct and costs nothing.
 *
 * LAST UPDATED: 2026-10-09 - File Created (Josh Iehle)
 */

// -------------------- Types --------------------
export type TripStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

// -------------------- Internal Helpers --------------------

/**
 * Collapses a Date to the UTC calendar day it falls on, as a comparable number.
 *
 * startDate and endDate are @db.Date columns, so Prisma hands them back at UTC
 * midnight. Comparing them against a raw `new Date()` would compare a midnight
 * timestamp against the current time of day, which makes a trip look COMPLETED
 * from 00:00 on its final day. Reducing both sides to a day number removes the
 * time component from the comparison entirely.
 */
function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

// -------------------- deriveTripStatus --------------------

/**
 * UPCOMING  - today is before the start date
 * ACTIVE    - today is between the start and end dates, both inclusive
 * COMPLETED - today is after the end date
 *
 * `now` is injectable so tests can pin a date instead of depending on when
 * the suite happens to run.
 */
export function deriveTripStatus(
  startDate: Date,
  endDate: Date,
  now: Date = new Date(),
): TripStatus {
  const today = utcDay(now);

  if (today < utcDay(startDate)) return 'UPCOMING';
  if (today > utcDay(endDate)) return 'COMPLETED';

  return 'ACTIVE';
}
