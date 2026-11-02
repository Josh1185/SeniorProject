/**
 * FILE: activitySchemas.test.ts
 * DESCRIPTION: Unit tests for activity validation schemas.
 *
 * RUNS WITH: npm test --workspace=server (FROM ROOT DIR OF PROJECT)
 *
 * LAST UPDATED: 2026-10-30 - Add activity validation tests (Brandon Douglass)
 */

// -------------------- Module imports --------------------
import { describe, expect, it } from 'vitest';
import { createActivitySchema, updateActivitySchema } from './activitySchemas';

// -------------------- Test Helpers --------------------

const VALID_ACTIVITY = {
  name: 'Visit the Museum',
  description: 'Explore the exhibits.',
  estimatedCostCents: 2500,
};

// -------------------- Create Schema --------------------

describe('createActivitySchema', () => {
  it('accepts a valid activity', () => {
    const result = createActivitySchema.safeParse(VALID_ACTIVITY);
    expect(result.success).toBe(true);
  });

  it('accepts an activity with only a name', () => {
    const result = createActivitySchema.safeParse({ name: 'Go Hiking' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing name', () => {
    const result = createActivitySchema.safeParse({
      description: 'No activity name',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only name', () => {
    const result = createActivitySchema.safeParse({ name: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects a negative estimated cost', () => {
    const result = createActivitySchema.safeParse({
      ...VALID_ACTIVITY,
      estimatedCostCents: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a decimal estimated cost', () => {
    const result = createActivitySchema.safeParse({
      ...VALID_ACTIVITY,
      estimatedCostCents: 25.5,
    });
    expect(result.success).toBe(false);
  });
});

// -------------------- Update Schema --------------------

describe('updateActivitySchema', () => {
  it('accepts an update with only a name', () => {
    const result = updateActivitySchema.safeParse({
      name: 'Visit the Aquarium',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an update with only an estimated cost', () => {
    const result = updateActivitySchema.safeParse({
      estimatedCostCents: 3000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty update request', () => {
    const result = updateActivitySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only name', () => {
    const result = updateActivitySchema.safeParse({
      name: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative estimated cost', () => {
    const result = updateActivitySchema.safeParse({
      estimatedCostCents: -500,
    });
    expect(result.success).toBe(false);
  });
});
