/**
 * FILE: reservationSchemas.test.ts
 * DESCRIPTION: Tests for reservation list query validation.
 */

// -------------------- Module Imports --------------------
import { describe, expect, it } from 'vitest';

// -------------------- Schema Imports --------------------
import { listReservationsQuerySchema } from './reservationSchemas';

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
});
