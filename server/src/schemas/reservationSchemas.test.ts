/**
 * FILE: reservationSchemas.test.ts
 * DESCRIPTION: Tests for reservation list query validation.
 */

// -------------------- Module Imports --------------------
import { describe, expect, it } from 'vitest';

// -------------------- Schema Imports --------------------
import {
  listReservationsQuerySchema,
  createReservationSchema,
  updateReservationSchema,
} from './reservationSchemas';

// -------------------- Tests --------------------

describe('listReservationsQuerySchema', () => {
  it('uses default sorting values', () => {
    const result = listReservationsQuerySchema.parse({});

    expect(result.sort).toBe('startDateTime');
    expect(result.order).toBe('asc');
  });

  it('accepts a valid reservation type', () => {
    const result = listReservationsQuerySchema.parse({
      type: 'HOTEL',
    });

    expect(result.type).toBe('HOTEL');
  });

  it('rejects an invalid reservation type', () => {
    const result = listReservationsQuerySchema.safeParse({
      type: 'INVALID',
    });

    expect(result.success).toBe(false);
  });

  it('trims the search term', () => {
    const result = listReservationsQuerySchema.parse({
      search: '  Hilton  ',
    });

    expect(result.search).toBe('Hilton');
  });

  it('rejects searches longer than 100 characters', () => {
    const result = listReservationsQuerySchema.safeParse({
      search: 'x'.repeat(101),
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid sorting options', () => {
    const result = listReservationsQuerySchema.parse({
      sort: 'name',
      order: 'desc',
    });

    expect(result.sort).toBe('name');
    expect(result.order).toBe('desc');
  });

  it('rejects invalid sorting options', () => {
    const result = listReservationsQuerySchema.safeParse({
      sort: 'costCents',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid sort directions', () => {
    const result = listReservationsQuerySchema.safeParse({
      order: 'sideways',
    });

    expect(result.success).toBe(false);
  });

  it('accepts empty filter parameters', () => {
    const result = listReservationsQuerySchema.parse({
      search: '',
      type: '',
      sort: '',
      order: '',
    });

    expect(result.search).toBeUndefined();
    expect(result.type).toBeUndefined();
    expect(result.sort).toBe('startDateTime');
    expect(result.order).toBe('asc');
  });

// -------------------- Create Reservation Tests --------------------

describe('createReservationSchema', () => {
  it('accepts a reservation with required fields', () => {
    const result = createReservationSchema.safeParse({
      type: 'HOTEL',
      name: 'Hilton New York',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a missing reservation name', () => {
    const result = createReservationSchema.safeParse({
      type: 'HOTEL',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid reservation type', () => {
    const result = createReservationSchema.safeParse({
      type: 'INVALID',
      name: 'Test Reservation',
    });

    expect(result.success).toBe(false);
  });

  it('rejects negative costs', () => {
    const result = createReservationSchema.safeParse({
      type: 'HOTEL',
      name: 'Hilton New York',
      costCents: -100,
    });

    expect(result.success).toBe(false);
  });

  it('rejects fractional costs', () => {
    const result = createReservationSchema.safeParse({
      type: 'HOTEL',
      name: 'Hilton New York',
      costCents: 85.50,
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid date and location', () => {
    const result = createReservationSchema.safeParse({
      type: 'FLIGHT',
      name: 'JFK to Orlando',
      startDateTime: '2026-12-20T08:00:00.000Z',
      locationName: 'JFK Airport',
      latitude: 40.6413,
      longitude: -73.7781,
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid coordinates', () => {
    const result = createReservationSchema.safeParse({
      type: 'HOTEL',
      name: 'Hilton New York',
      latitude: 100,
    });

    expect(result.success).toBe(false);
  });
});

// -------------------- Update Reservation Tests --------------------

describe('updateReservationSchema', () => {
  it('accepts a partial update', () => {
    const result = updateReservationSchema.safeParse({
      name: 'Updated Hotel',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty update', () => {
    const result = updateReservationSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('allows nullable fields to be cleared', () => {
    const result = updateReservationSchema.safeParse({
      notes: null,
      confirmationNumber: null,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid cost', () => {
    const result = updateReservationSchema.safeParse({
      costCents: -500,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty reservation name', () => {
    const result = updateReservationSchema.safeParse({
      name: '   ',
    });

    expect(result.success).toBe(false);
  });
});



});