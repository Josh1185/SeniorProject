
/**
 * FILE: itinerarySchemas.test.ts
 * DESCRIPTION: Unit tests for itinerary event validation schemas.
 *
 *              Pure functions, no database, no mocks.
 */

// -------------------- Module imports --------------------

import { describe, expect, it } from 'vitest';
import {
  createItineraryEventSchema,
  updateItineraryEventSchema,
} from './itinerarySchemas';

// -------------------- Test Helpers --------------------

const VALID_EVENT = {
  title: 'Visit Magic Kingdom',
  startDateTime: '2026-06-12T14:00:00Z',
  timeZone: 'America/New_York',
};

// -------------------- Create Schema --------------------

describe('createItineraryEventSchema', () => {
  it('accepts a well-formed event', () => {
    expect(createItineraryEventSchema.safeParse(VALID_EVENT).success).toBe(true);
  });

  it('accepts all optional event fields', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      description: 'Spend the afternoon at the park.',
      endDateTime: '2026-06-12T20:00:00Z',
      locationName: 'Magic Kingdom',
      locationAddress: 'Bay Lake, FL',
      latitude: 28.4177,
      longitude: -81.5812,
    });

    expect(result.success).toBe(true);
  });

  it('trims surrounding whitespace from the title', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      title: '  Visit Magic Kingdom  ',
    });

    expect(result.success && result.data.title).toBe('Visit Magic Kingdom');
  });

  it('rejects a title that is only whitespace', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      title: '   ',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a missing title', () => {
    const { title: _title, ...withoutTitle } = VALID_EVENT;

    expect(createItineraryEventSchema.safeParse(withoutTitle).success).toBe(false);
  });

  it('rejects a missing start date/time', () => {
    const { startDateTime: _startDateTime, ...withoutStart } = VALID_EVENT;

    expect(createItineraryEventSchema.safeParse(withoutStart).success).toBe(false);
  });

  it('rejects a malformed start date/time', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      startDateTime: 'June 12th at 2 PM',
    });

    expect(result.success).toBe(false);
  });

  it('accepts an event with no end date/time', () => {
    expect(createItineraryEventSchema.safeParse(VALID_EVENT).success).toBe(true);
  });

  it('accepts an end date/time equal to the start date/time', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      endDateTime: VALID_EVENT.startDateTime,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an end date/time before the start date/time', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      endDateTime: '2026-06-12T13:00:00Z',
    });

    expect(result.success).toBe(false);
  });

  it('reports the end date/time ordering error against endDateTime', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      endDateTime: '2026-06-12T13:00:00Z',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['endDateTime']);
    }
  });

  it('accepts explicit nulls for optional fields', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      description: null,
      endDateTime: null,
      locationName: null,
      locationAddress: null,
      latitude: null,
      longitude: null,
    });

    expect(result.success).toBe(true);
  });

  // ----- Coordinates -----

  it('accepts valid coordinates', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      latitude: 28.4177,
      longitude: -81.5812,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a latitude without a longitude', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      latitude: 28.4177,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a longitude without a latitude', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      longitude: -81.5812,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an out-of-range latitude', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      latitude: 91,
      longitude: -81.5812,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an out-of-range longitude', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      latitude: 28.4177,
      longitude: 181,
    });

    expect(result.success).toBe(false);
  });

  it('rejects coordinates sent as strings', () => {
    const result = createItineraryEventSchema.safeParse({
      ...VALID_EVENT,
      latitude: '28.4177',
      longitude: '-81.5812',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a missing time zone', () => {
  const { timeZone: _timeZone, ...withoutTimeZone } = VALID_EVENT;

  expect(createItineraryEventSchema.safeParse(withoutTimeZone).success).toBe(false);
});
});

// -------------------- Update Schema --------------------


describe('updateItineraryEventSchema', () => {
  const TIME_ZONE = 'America/New_York';

  it('accepts a single-field update', () => {
    expect(
      updateItineraryEventSchema.safeParse({
        title: 'Visit Universal Studios',
        timeZone: TIME_ZONE,
      }).success,
    ).toBe(true);
  });

  it('accepts an update without timestamps', () => {
    expect(
      updateItineraryEventSchema.safeParse({
        locationName: 'Universal Studios',
        timeZone: TIME_ZONE,
      }).success,
    ).toBe(true);
  });

  it('rejects an empty update body', () => {
    expect(
      updateItineraryEventSchema.safeParse({
        timeZone: TIME_ZONE,
      }).success,
    ).toBe(false);
  });

  it('rejects a missing time zone', () => {
    expect(
      updateItineraryEventSchema.safeParse({
        title: 'Updated event title',
      }).success,
    ).toBe(false);
  });

  it('rejects a time-zone-only update', () => {
    expect(
      updateItineraryEventSchema.safeParse({
        timeZone: TIME_ZONE,
      }).success,
    ).toBe(false);
  });

  it('rejects an out-of-order pair when both timestamps are supplied', () => {
    const result = updateItineraryEventSchema.safeParse({
      startDateTime: '2026-06-12T20:00:00Z',
      endDateTime: '2026-06-12T14:00:00Z',
      timeZone: TIME_ZONE,
    });

    expect(result.success).toBe(false);
  });

  it('allows updating only the start date/time', () => {
    expect(
      updateItineraryEventSchema.safeParse({
        startDateTime: '2026-06-12T15:00:00Z',
        timeZone: TIME_ZONE,
      }).success,
    ).toBe(true);
  });

  it('allows updating only the end date/time', () => {
    expect(
      updateItineraryEventSchema.safeParse({
        endDateTime: '2026-06-12T20:00:00Z',
        timeZone: TIME_ZONE,
      }).success,
    ).toBe(true);
  });

  it('still enforces field-level validation', () => {
    expect(
      updateItineraryEventSchema.safeParse({
        title: '',
        timeZone: TIME_ZONE,
      }).success,
    ).toBe(false);
  });

  it('accepts clearing optional fields with null', () => {
    const result = updateItineraryEventSchema.safeParse({
      description: null,
      endDateTime: null,
      locationName: null,
      locationAddress: null,
      timeZone: TIME_ZONE,
    });

    expect(result.success).toBe(true);
  });

  it('accepts clearing both coordinates with null', () => {
    const result = updateItineraryEventSchema.safeParse({
      latitude: null,
      longitude: null,
      timeZone: TIME_ZONE,
    });

    expect(result.success).toBe(true);
  });

  it('rejects updating only one coordinate', () => {
    expect(
      updateItineraryEventSchema.safeParse({
        latitude: 28.4177,
        timeZone: TIME_ZONE,
      }).success,
    ).toBe(false);
  });

  it('accepts updating both coordinates together', () => {
    expect(
      updateItineraryEventSchema.safeParse({
        latitude: 28.4177,
        longitude: -81.5812,
        timeZone: TIME_ZONE,
      }).success,
    ).toBe(true);
  });

  it('leaves coordinates alone when neither is supplied', () => {
    expect(
      updateItineraryEventSchema.safeParse({
        title: 'Updated event title',
        timeZone: TIME_ZONE,
      }).success,
    ).toBe(true);
  });
});
