/**
 * FILE: tripSchemas.test.ts
 * DESCRIPTION: Unit tests for trip validation schemas.
 *
 *              Pure functions, no database, no mocks. Validation is where
 *              most bad requests should die, so it is worth testing properly.
 *
 * RUNS WITH: npm test --workspace=server (FROM ROOT DIR OF PROJECT)
 *
 * LAST UPDATED: 2026-10-09 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { describe, expect, it } from 'vitest';
import { createTripSchema, updateTripSchema } from './tripSchemas';

// -------------------- Test Helpers --------------------

const VALID_TRIP = {
  name: 'Orlando Trip',
  destination: 'Orlando, FL',
  startDate: '2026-06-12',
  endDate: '2026-06-17',
};

// -------------------- Create Schema --------------------

describe('createTripSchema', () => {
  it('accepts a well-formed trip', () => {
    const result = createTripSchema.safeParse(VALID_TRIP);
    expect(result.success).toBe(true);
  });

  it('accepts an optional description', () => {
    const result = createTripSchema.safeParse({ ...VALID_TRIP, description: 'Theme parks.' });
    expect(result.success).toBe(true);
  });

  it('trims surrounding whitespace', () => {
    // Otherwise "  Orlando  " and "Orlando" become two different-looking trips.
    const result = createTripSchema.safeParse({ ...VALID_TRIP, name: '  Orlando Trip  ' });
    expect(result.success && result.data.name).toBe('Orlando Trip');
  });

  it('rejects a name that is only whitespace', () => {
    // Trim runs before min(1), so "   " collapses to "" and fails.
    const result = createTripSchema.safeParse({ ...VALID_TRIP, name: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing destination', () => {
    const { destination: _destination, ...withoutDestination } = VALID_TRIP;
    expect(createTripSchema.safeParse(withoutDestination).success).toBe(false);
  });

  it('rejects an end date before the start date', () => {
    const result = createTripSchema.safeParse({
      ...VALID_TRIP,
      startDate: '2026-06-17',
      endDate: '2026-06-12',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a single-day trip', () => {
    // The boundary case: equal dates are valid, the rule is >= not >.
    const result = createTripSchema.safeParse({
      ...VALID_TRIP,
      startDate: '2026-06-12',
      endDate: '2026-06-12',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a full timestamp in a date field', () => {
    // Accepting these would invite timezone bugs - an evening timestamp in a
    // western offset is the following day in UTC.
    const result = createTripSchema.safeParse({
      ...VALID_TRIP,
      startDate: '2026-06-12T14:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed date', () => {
    expect(createTripSchema.safeParse({ ...VALID_TRIP, startDate: 'June 12th' }).success).toBe(
      false,
    );
  });

  it('reports the date ordering error against the endDate field', () => {
    // The client highlights the field named in `path`, so it has to be right.
    const result = createTripSchema.safeParse({
      ...VALID_TRIP,
      startDate: '2026-06-17',
      endDate: '2026-06-12',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['endDate']);
    }
  });
});

// -------------------- Update Schema --------------------

describe('updateTripSchema', () => {
  it('accepts a single field', () => {
    expect(updateTripSchema.safeParse({ name: 'Renamed Trip' }).success).toBe(true);
  });

  it('accepts a partial update with no dates at all', () => {
    const result = updateTripSchema.safeParse({ destination: 'Tampa, FL' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty body', () => {
    // A no-op PATCH is almost always a client bug worth surfacing.
    expect(updateTripSchema.safeParse({}).success).toBe(false);
  });

  it('rejects an out-of-order pair when both dates are supplied', () => {
    const result = updateTripSchema.safeParse({
      startDate: '2026-06-17',
      endDate: '2026-06-12',
    });
    expect(result.success).toBe(false);
  });

  it('allows one date on its own', () => {
    // The schema cannot compare against the stored value, so it defers. The
    // controller re-checks the merged result before writing.
    expect(updateTripSchema.safeParse({ endDate: '2026-06-20' }).success).toBe(true);
    expect(updateTripSchema.safeParse({ startDate: '2026-06-10' }).success).toBe(true);
  });

  it('still enforces field-level rules', () => {
    expect(updateTripSchema.safeParse({ name: '' }).success).toBe(false);
  });
});
