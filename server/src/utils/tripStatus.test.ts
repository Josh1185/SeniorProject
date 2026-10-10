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
 * LAST UPDATED: 2026-10-09 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { describe, expect, it } from 'vitest';
import { deriveTripStatus } from './tripStatus';

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
