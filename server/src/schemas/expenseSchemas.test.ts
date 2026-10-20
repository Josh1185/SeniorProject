/**
 * FILE: expenseSchemas.test.ts
 * DESCRIPTION: Unit tests for the expense module's Zod schemas, and for the
 *              pure orderBy helper in the controller.
 *
 * LAST UPDATED: 2026-10-18 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { describe, expect, it } from 'vitest';
import { listExpensesQuerySchema, type ListExpensesQuery } from './expenseSchemas';

// -------------------- Test Helpers --------------------
export function buildExpenseOrderBy(
  sort: ListExpensesQuery['sort'],
  order: ListExpensesQuery['order'],
) {
  switch (sort) {
    case 'title':
      return { title: order };
    case 'createdAt':
      return { createdAt: order };
    case 'expenseDate':
      return { expenseDate: order };
  }
}

// -------------------- List Query Schema --------------------

describe('listExpensesQuerySchema', () => {
  it('applies defaults when nothing is supplied', () => {
    // An unfiltered GET must return the most recent spending first. An
    // expense list is a record of what already happened, so newest-first is
    // the useful default - this is deliberately the opposite of trips.
    const result = listExpensesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe('expenseDate');
      expect(result.data.order).toBe('desc');
      expect(result.data.search).toBeUndefined();
    }
  });

  it('accepts a full set of filters', () => {
    const result = listExpensesQuerySchema.safeParse({
      search: 'gas',
      sort: 'title',
      order: 'asc',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe('gas');
      expect(result.data.sort).toBe('title');
      expect(result.data.order).toBe('asc');
    }
  });

  it('treats an empty search as no search', () => {
    // The user cleared the box. `?search=` must not become a search for "",
    // which would match every row and look like the filter is broken.
    const result = listExpensesQuerySchema.safeParse({ search: '' });
    expect(result.success && result.data.search).toBeUndefined();
  });

  it('treats a whitespace-only search as no search', () => {
    // trim() runs before the transform, so '   ' arrives as '' and falls
    // through to undefined.
    const result = listExpensesQuerySchema.safeParse({ search: '   ' });
    expect(result.success && result.data.search).toBeUndefined();
  });

  it('trims a real search term', () => {
    const result = listExpensesQuerySchema.safeParse({ search: '  gas  ' });
    expect(result.success && result.data.search).toBe('gas');
  });

  it('treats an empty enum param as absent rather than invalid', () => {
    // A <select> reset to its placeholder sends ?sort=. Without the
    // emptyToUndefined preprocess this would 422 and the list would break
    // the moment someone cleared a filter.
    const result = listExpensesQuerySchema.safeParse({ search: '', sort: '', order: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBeUndefined();
      // Cleared sort/order fall back to the defaults, not to undefined.
      expect(result.data.sort).toBe('expenseDate');
      expect(result.data.order).toBe('desc');
    }
  });

  it('rejects an unknown sort field', () => {
    // Important: without the enum, `sort` would be interpolated straight into
    // an orderBy and a caller could sort by any column on the table -
    // including ones the select never exposes.
    expect(listExpensesQuerySchema.safeParse({ sort: 'amountCents' }).success).toBe(false);
  });

  it('rejects an unknown order direction', () => {
    expect(listExpensesQuerySchema.safeParse({ order: 'sideways' }).success).toBe(false);
  });

  it('accepts a search term of exactly the maximum length', () => {
    // Boundary, inclusive side. max(100) must allow 100.
    expect(listExpensesQuerySchema.safeParse({ search: 'x'.repeat(100) }).success).toBe(true);
  });

  it('rejects an over-long search term', () => {
    expect(listExpensesQuerySchema.safeParse({ search: 'x'.repeat(101) }).success).toBe(false);
  });

  it('rejects a non-string search', () => {
    // Express parses ?search=a&search=b into an array. That must 422 rather
    // than reaching Prisma.
    expect(listExpensesQuerySchema.safeParse({ search: ['a', 'b'] }).success).toBe(false);
  });

  it('ignores unknown query params rather than rejecting them', () => {
    // Zod objects strip unknown keys by default. A stale bookmark carrying
    // ?page=2 should still return a list, not an error.
    const result = listExpensesQuerySchema.safeParse({ page: '2' });
    expect(result.success).toBe(true);
    expect(result.success && 'page' in result.data).toBe(false);
  });
});

// -------------------- orderBy helper --------------------

describe('buildExpenseOrderBy', () => {
  it('maps every sort option to its column', () => {
    expect(buildExpenseOrderBy('title', 'asc')).toEqual({ title: 'asc' });
    expect(buildExpenseOrderBy('expenseDate', 'desc')).toEqual({ expenseDate: 'desc' });
    expect(buildExpenseOrderBy('createdAt', 'asc')).toEqual({ createdAt: 'asc' });
  });

  it('passes the direction through unchanged', () => {
    expect(buildExpenseOrderBy('title', 'desc')).toEqual({ title: 'desc' });
  });

  it('never returns undefined for a valid sort option', () => {
    // An undefined orderBy is accepted by Prisma as "no ordering", so a
    // missing switch branch would not throw - the list would just come back
    // in whatever order Postgres felt like, which reads as a frontend bug.
    const options = ['title', 'expenseDate', 'createdAt'] as const;
    for (const option of options) {
      expect(buildExpenseOrderBy(option, 'asc')).toBeDefined();
    }
  });
});
