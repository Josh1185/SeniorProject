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
import { createTripSchema, updateTripSchema, listTripsQuerySchema } from './tripSchemas';

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

  // ----- Destination address and coordinates -----

  it('accepts a destination with an address and coordinates', () => {
    const result = createTripSchema.safeParse({
      ...VALID_TRIP,
      destinationAddress: 'Orlando, FL, United States',
      latitude: 28.5384,
      longitude: -81.3789,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a destination with no address or coordinates', () => {
    // Typing "Grandma's cabin" is a legitimate destination that no geocoder
    // has heard of, so all three must stay optional.
    expect(createTripSchema.safeParse(VALID_TRIP).success).toBe(true);
  });

  it('accepts explicit nulls', () => {
    const result = createTripSchema.safeParse({
      ...VALID_TRIP,
      destinationAddress: null,
      latitude: null,
      longitude: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a latitude with no longitude', () => {
    // Half a coordinate cannot be mapped, so it is a client bug, not a
    // partial success.
    const result = createTripSchema.safeParse({ ...VALID_TRIP, latitude: 28.5384 });
    expect(result.success).toBe(false);
  });

  it('rejects a longitude with no latitude', () => {
    const result = createTripSchema.safeParse({ ...VALID_TRIP, longitude: -81.3789 });
    expect(result.success).toBe(false);
  });

  it('rejects an out-of-range latitude', () => {
    // 91 is not a latitude. Catching it here is what stops a transposed
    // lat/lng pair pinning the map in the Arctic.
    const result = createTripSchema.safeParse({
      ...VALID_TRIP,
      latitude: 91,
      longitude: -81.3789,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an out-of-range longitude', () => {
    const result = createTripSchema.safeParse({
      ...VALID_TRIP,
      latitude: 28.5384,
      longitude: 181,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a coordinate sent as a string', () => {
    // The client sends JSON, so a real number arrives as a number. A string
    // means something built the request wrong, and a silent coercion would
    // hide that.
    const result = createTripSchema.safeParse({
      ...VALID_TRIP,
      latitude: '28.5384',
      longitude: '-81.3789',
    });
    expect(result.success).toBe(false);
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

  // ----- Destination address and coordinates -----

  it('accepts clearing the coordinates with explicit nulls', () => {
    // This is the request that removes a map pin: the destination was re-typed
    // by hand, so the old coordinates must go. `null` is what makes Prisma
    // write NULL rather than skip the column.
    const result = updateTripSchema.safeParse({ latitude: null, longitude: null });
    expect(result.success).toBe(true);
  });

  it('accepts updating both coordinates together', () => {
    const result = updateTripSchema.safeParse({ latitude: 28.5384, longitude: -81.3789 });
    expect(result.success).toBe(true);
  });

  it('rejects updating one coordinate alone', () => {
    // Moving one axis would leave the pin somewhere nobody chose.
    expect(updateTripSchema.safeParse({ latitude: 28.5384 }).success).toBe(false);
  });

  it('leaves the coordinates alone when neither is in the request', () => {
    // Both absent is not the same as one absent - a PATCH that only renames
    // the trip must not trip the paired-coordinate rule.
    expect(updateTripSchema.safeParse({ name: 'Renamed Trip' }).success).toBe(true);
  });
});

// -------------------- List Query Schema --------------------

describe('listTripsQuerySchema', () => {
  it('applies defaults when nothing is supplied', () => {
    // An unfiltered GET /api/trips must behave exactly as it did before
    // query params existed: soonest trip first.
    const result = listTripsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe('startDate');
      expect(result.data.order).toBe('asc');
      expect(result.data.search).toBeUndefined();
      expect(result.data.status).toBeUndefined();
      expect(result.data.role).toBeUndefined();
    }
  });

  it('accepts a full set of filters', () => {
    const result = listTripsQuerySchema.safeParse({
      search: 'orlando',
      status: 'UPCOMING',
      role: 'OWNER',
      sort: 'name',
      order: 'desc',
    });
    expect(result.success).toBe(true);
  });

  it('treats an empty search as no search', () => {
    // The user cleared the box. `?search=` must not become a search for "".
    const result = listTripsQuerySchema.safeParse({ search: '' });
    expect(result.success && result.data.search).toBeUndefined();
  });

  it('treats a whitespace-only search as no search', () => {
    const result = listTripsQuerySchema.safeParse({ search: '   ' });
    expect(result.success && result.data.search).toBeUndefined();
  });

  it('trims a real search term', () => {
    const result = listTripsQuerySchema.safeParse({ search: '  orlando  ' });
    expect(result.success && result.data.search).toBe('orlando');
  });

  it('treats an empty enum param as absent rather than invalid', () => {
    // A <select> reset to its placeholder sends ?status=. Without the
    // emptyToUndefined preprocess this would 422 and the UI would break
    // the moment someone cleared a filter.
    const result = listTripsQuerySchema.safeParse({ status: '', role: '', sort: '', order: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBeUndefined();
      expect(result.data.role).toBeUndefined();
      // Cleared sort/order fall back to the defaults, not to undefined.
      expect(result.data.sort).toBe('startDate');
      expect(result.data.order).toBe('asc');
    }
  });

  it('rejects an unknown status', () => {
    expect(listTripsQuerySchema.safeParse({ status: 'CANCELLED' }).success).toBe(false);
  });

  it('rejects an unknown sort field', () => {
    // Important: without the enum, `sort` would be interpolated straight into
    // an orderBy and a caller could sort by any column in the table.
    expect(listTripsQuerySchema.safeParse({ sort: 'description' }).success).toBe(false);
  });

  it('rejects an unknown order direction', () => {
    expect(listTripsQuerySchema.safeParse({ order: 'sideways' }).success).toBe(false);
  });

  it('rejects an over-long search term', () => {
    expect(listTripsQuerySchema.safeParse({ search: 'x'.repeat(101) }).success).toBe(false);
  });
});
