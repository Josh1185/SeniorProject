/**
 * FILE: tripStatus.test.ts
 * DESCRIPTION: Unit tests for trip status derivation.
 *
 *              Pure function, no database, no mocks. These are the cheapest
 *              tests in the codebase and they cover the boundary days, which
 *              are exactly where date logic goes wrong.
 *
 * RUNS WITH: npm test --workspace=server (FROM ROOT DIR OF PROJECT)
 *
 * LAST UPDATED: 2026-10-10 - Add statusDateFilter agreement tests (Josh Iehle)
 *               2026-10-09 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { describe, expect, it } from 'vitest';
import { deriveTripStatus, statusDateFilter, type TripStatus } from './tripStatus';

// -------------------- Test Helpers --------------------

/** Builds a UTC-midnight date, matching how Prisma returns @db.Date columns. */
function utc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

const START = utc(2026, 6, 12);
const END = utc(2026, 6, 17);

// -------------------- Tests --------------------

describe('deriveTripStatus', () => {
  it('is UPCOMING before the trip starts', () => {
    expect(deriveTripStatus(START, END, utc(2026, 6, 1))).toBe('UPCOMING');
  });

  it('is UPCOMING on the day before the start date', () => {
    expect(deriveTripStatus(START, END, utc(2026, 6, 11))).toBe('UPCOMING');
  });

  it('is ACTIVE on the start date itself', () => {
    // Inclusive boundary. A trip that starts today is happening today.
    expect(deriveTripStatus(START, END, utc(2026, 6, 12))).toBe('ACTIVE');
  });

  it('is ACTIVE in the middle of the trip', () => {
    expect(deriveTripStatus(START, END, utc(2026, 6, 15))).toBe('ACTIVE');
  });

  it('is ACTIVE on the end date itself', () => {
    // The other inclusive boundary, and the one most likely to be wrong.
    expect(deriveTripStatus(START, END, utc(2026, 6, 17))).toBe('ACTIVE');
  });

  it('is COMPLETED the day after the end date', () => {
    expect(deriveTripStatus(START, END, utc(2026, 6, 18))).toBe('COMPLETED');
  });

  it('is ACTIVE all day on the end date, not just at midnight', () => {
    // Guards the reason utcDay() exists. Comparing a late-evening timestamp
    // against a midnight date column would report COMPLETED a day early.
    const lateOnFinalDay = new Date(Date.UTC(2026, 5, 17, 23, 59, 0));
    expect(deriveTripStatus(START, END, lateOnFinalDay)).toBe('ACTIVE');
  });

  it('handles a single-day trip', () => {
    const oneDay = utc(2026, 6, 12);
    expect(deriveTripStatus(oneDay, oneDay, utc(2026, 6, 11))).toBe('UPCOMING');
    expect(deriveTripStatus(oneDay, oneDay, utc(2026, 6, 12))).toBe('ACTIVE');
    expect(deriveTripStatus(oneDay, oneDay, utc(2026, 6, 13))).toBe('COMPLETED');
  });
});

// -------------------- statusDateFilter --------------------

/**
 * Evaluates a Prisma date filter against one trip, in plain JavaScript.
 *
 * This mirrors how Postgres applies gt / gte / lt / lte so the test can prove
 * the filter and the deriver agree WITHOUT needing a database. The comparison
 * operators are simple enough that reimplementing them here is trustworthy.
 */
function filterMatches(
  trip: { startDate: Date; endDate: Date },
  filter: ReturnType<typeof statusDateFilter>,
): boolean {
  const start = trip.startDate.getTime();
  const end = trip.endDate.getTime();

  const startRule = 'startDate' in filter ? filter.startDate : undefined;
  const endRule = 'endDate' in filter ? filter.endDate : undefined;

  if (startRule && startRule.gt && 'gt' in startRule && !(start > startRule.gt.getTime())) return false;
  if (startRule && startRule.lte && 'lte' in startRule && !(start <= startRule.lte.getTime())) return false;
  if (endRule && endRule.lt && 'lt' in endRule && !(end < endRule.lt.getTime())) return false;
  if (endRule && endRule.gte && 'gte' in endRule && !(end >= endRule.gte.getTime())) return false;

  return true;
}

describe('statusDateFilter', () => {
  const TODAY = utc(2026, 6, 15);

  // A spread of trips around TODAY, including every boundary case.
  const TRIPS = [
    { label: 'well in the future', startDate: utc(2026, 7, 1), endDate: utc(2026, 7, 5) },
    { label: 'starts tomorrow', startDate: utc(2026, 6, 16), endDate: utc(2026, 6, 20) },
    { label: 'starts today', startDate: utc(2026, 6, 15), endDate: utc(2026, 6, 20) },
    { label: 'spans today', startDate: utc(2026, 6, 12), endDate: utc(2026, 6, 17) },
    { label: 'ends today', startDate: utc(2026, 6, 10), endDate: utc(2026, 6, 15) },
    { label: 'ended yesterday', startDate: utc(2026, 6, 1), endDate: utc(2026, 6, 14) },
    { label: 'well in the past', startDate: utc(2025, 1, 1), endDate: utc(2025, 1, 5) },
    { label: 'single day, today', startDate: TODAY, endDate: TODAY },
  ];

  const STATUSES: TripStatus[] = ['UPCOMING', 'ACTIVE', 'COMPLETED'];

  // THE IMPORTANT TEST. If someone changes one function without the other,
  // the list would quietly return trips whose displayed badge disagrees with
  // the filter the user selected. This catches that.
  for (const status of STATUSES) {
    it(`selects exactly the trips deriveTripStatus calls ${status}`, () => {
      const filter = statusDateFilter(status, TODAY);

      for (const trip of TRIPS) {
        const derived = deriveTripStatus(trip.startDate, trip.endDate, TODAY);
        expect(filterMatches(trip, filter), `${trip.label} (derived ${derived})`).toBe(
          derived === status,
        );
      }
    });
  }

  it('partitions every trip into exactly one status', () => {
    // No trip may match two filters, and none may match zero.
    for (const trip of TRIPS) {
      const matches = STATUSES.filter((status) =>
        filterMatches(trip, statusDateFilter(status, TODAY)),
      );
      expect(matches, trip.label).toHaveLength(1);
    }
  });
});
