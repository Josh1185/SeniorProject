
import { describe, expect, it } from 'vitest';
import { isWithinTripDateRange } from './itineraryDateRange';

describe('isWithinTripDateRange', () => {
  const tripStart = new Date('2026-11-10T00:00:00.000Z');
  const tripEnd = new Date('2026-11-17T00:00:00.000Z');
  const timeZone = 'America/New_York';

  it('accepts an event on the first trip day', () => {
    expect(
      isWithinTripDateRange(
        new Date('2026-11-10T15:00:00.000Z'),
        timeZone,
        tripStart,
        tripEnd,
      ),
    ).toBe(true);
  });

  it('accepts an event on the final trip day', () => {
    expect(
      isWithinTripDateRange(
        new Date('2026-11-17T15:00:00.000Z'),
        timeZone,
        tripStart,
        tripEnd,
      ),
    ).toBe(true);
  });

  it('rejects an event before the trip', () => {
    expect(
      isWithinTripDateRange(
        new Date('2026-11-09T15:00:00.000Z'),
        timeZone,
        tripStart,
        tripEnd,
      ),
    ).toBe(false);
  });

  it('rejects an event after the trip', () => {
    expect(
      isWithinTripDateRange(
        new Date('2026-11-18T15:00:00.000Z'),
        timeZone,
        tripStart,
        tripEnd,
      ),
    ).toBe(false);
  });

  it('accepts a late-night event on the final local trip day even when its UTC date is the next day', () => {
    // 11:30 PM on November 17 in New York = 4:30 AM UTC on November 18.
    expect(
      isWithinTripDateRange(
        new Date('2026-11-18T04:30:00.000Z'),
        timeZone,
        tripStart,
        tripEnd,
      ),
    ).toBe(true);
  });

  it('rejects an invalid event date', () => {
    expect(
      isWithinTripDateRange(
        new Date('invalid'),
        timeZone,
        tripStart,
        tripEnd,
      ),
    ).toBe(false);
  });

  it('throws for an invalid time zone', () => {
    expect(() =>
      isWithinTripDateRange(
        new Date('2026-11-17T15:00:00.000Z'),
        'Not/A_Time_Zone',
        tripStart,
        tripEnd,
      ),
    ).toThrow(RangeError);
  });
});
