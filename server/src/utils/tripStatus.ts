/**
 * FILE: tripStatus.ts
 * DESCRIPTION: Derives a trip's status from its dates.
 *
 *              Status is NOT stored in the database. Storing it would need a
 *              scheduled job to flip UPCOMING -> ACTIVE -> COMPLETED as dates
 *              pass, and the row would be wrong in between runs. Deriving it on
 *              read is always correct and costs nothing.
 *
 *              The trade-off is that you cannot put `status` in a WHERE clause.
 *              statusDateFilter() solves that by expressing each status as the
 *              date comparison it actually means, so filtering still happens in
 *              Postgres rather than in JavaScript after the fact.
 *
 * LAST UPDATED: 2026-10-10 - Add statusDateFilter for list filtering (Josh Iehle)
 *               2026-10-09 - File Created (Josh Iehle)
 */

// -------------------- Types --------------------
export type TripStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

// -------------------- Internal Helpers --------------------

/**
 * Collapses a Date to midnight on the UTC calendar day it falls on.
 *
 * startDate and endDate are @db.Date columns, so Prisma hands them back at UTC
 * midnight. Comparing them against a raw `new Date()` would compare a midnight
 * timestamp against the current time of day, which makes a trip look COMPLETED
 * from 00:00 on its final day. Reducing both sides to the start of their day
 * removes the time component from the comparison entirely.
 */
function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
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
  const today = startOfUtcDay(now).getTime();

  if (today < startOfUtcDay(startDate).getTime()) return 'UPCOMING';
  if (today > startOfUtcDay(endDate).getTime()) return 'COMPLETED';

  return 'ACTIVE';
}

// -------------------- statusDateFilter --------------------

/**
 * The inverse of deriveTripStatus: the Prisma `where` fragment that selects
 * exactly the trips deriveTripStatus would label with this status.
 *
 * Spread into a query's where clause:
 *
 *   where: { members: { some: { userId } }, ...statusDateFilter('ACTIVE') }
 *
 * These two functions MUST agree. tripStatus.test.ts proves they do, which
 * matters because the alternative - fetching every trip and filtering in
 * JavaScript - silently breaks the moment pagination is added.
 */
export function statusDateFilter(status: TripStatus, now: Date = new Date()) {
  const today = startOfUtcDay(now);

  switch (status) {
    case 'UPCOMING':
      // Starts strictly after today.
      return { startDate: { gt: today } };

    case 'ACTIVE':
      // Started on or before today AND ends on or after today.
      return { startDate: { lte: today }, endDate: { gte: today } };

    case 'COMPLETED':
      // Ended strictly before today.
      return { endDate: { lt: today } };
  }
}
