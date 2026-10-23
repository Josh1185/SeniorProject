/**
 * FILE: expenseSchemas.test.ts
 * DESCRIPTION: Unit tests for the expense module's Zod schemas, and for the
 *              pure orderBy helper in the controller.
 *
 * LAST UPDATED: 2026-10-20 - Add create and update schema tests (Josh Iehle)
 *               2026-10-18 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { describe, expect, it } from 'vitest';
import {
  createExpenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
  type ListExpensesQuery,
} from './expenseSchemas';

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

// -------------------- Fixtures --------------------

const USER_A = '01a1568d-45db-70de-9115-291ebacf0bc3';
const USER_B = '01a1568d-45db-70de-9115-291ebacf0bc4';
const USER_C = '01a1568d-45db-70de-9115-291ebacf0bc5';

/** A body that must always be valid, so each test below changes exactly one thing. */
const validExpense = {
  title: 'Gas',
  amountCents: 6200,
  expenseDate: '2026-11-12',
  paidById: USER_A,
  participantIds: [USER_A, USER_B, USER_C],
};

// -------------------- Create Schema --------------------

describe('createExpenseSchema', () => {
  it('accepts a complete valid body', () => {
    expect(createExpenseSchema.safeParse(validExpense).success).toBe(true);
  });

  it('accepts an omitted description', () => {
    expect(createExpenseSchema.safeParse(validExpense).success).toBe(true);
  });

  it('accepts an explicit null description', () => {
    // null and undefined mean different things on a PATCH - null clears the
    // column - so both must be valid.
    const result = createExpenseSchema.safeParse({ ...validExpense, description: null });
    expect(result.success).toBe(true);
  });

  it('trims the title', () => {
    const result = createExpenseSchema.safeParse({ ...validExpense, title: '  Gas  ' });
    expect(result.success && result.data.title).toBe('Gas');
  });

  it('rejects a missing title', () => {
    const { title, ...withoutTitle } = validExpense;
    void title;
    expect(createExpenseSchema.safeParse(withoutTitle).success).toBe(false);
  });

  it('rejects a whitespace-only title', () => {
    // trim() runs before min(1), so '   ' is an empty title, not a valid one.
    expect(createExpenseSchema.safeParse({ ...validExpense, title: '   ' }).success).toBe(false);
  });

  // ----- Money. The important block. -----

  it('rejects a fractional amount', () => {
    // 62.50 means the client sent DOLLARS. Letting that through would write
    // 62 cents to the database and nothing would ever flag it.
    expect(createExpenseSchema.safeParse({ ...validExpense, amountCents: 62.5 }).success).toBe(
      false,
    );
  });

  it('rejects an amount of zero', () => {
    expect(createExpenseSchema.safeParse({ ...validExpense, amountCents: 0 }).success).toBe(false);
  });

  it('rejects a negative amount', () => {
    expect(createExpenseSchema.safeParse({ ...validExpense, amountCents: -100 }).success).toBe(
      false,
    );
  });

  it('accepts the largest amount a Postgres Int can hold', () => {
    const result = createExpenseSchema.safeParse({ ...validExpense, amountCents: 2_147_483_647 });
    expect(result.success).toBe(true);
  });

  it('rejects an amount larger than a Postgres Int', () => {
    // Without this bound Postgres raises an out-of-range error and the caller
    // gets a 500 instead of a 422 naming the field.
    expect(
      createExpenseSchema.safeParse({ ...validExpense, amountCents: 2_147_483_648 }).success,
    ).toBe(false);
  });

  it('rejects an amount sent as a string', () => {
    // No z.coerce here on purpose: the client sends JSON, so a real number is
    // what should arrive. A string means something built the request wrong.
    expect(createExpenseSchema.safeParse({ ...validExpense, amountCents: '6200' }).success).toBe(
      false,
    );
  });

  // ----- Dates -----

  it('rejects a full timestamp where a date is required', () => {
    // @db.Date stores a day, not an instant. Accepting a timestamp here is
    // how dates land a day early for anyone west of Greenwich.
    expect(
      createExpenseSchema.safeParse({ ...validExpense, expenseDate: '2026-11-12T00:00:00.000Z' })
        .success,
    ).toBe(false);
  });

  it('rejects a malformed date', () => {
    expect(
      createExpenseSchema.safeParse({ ...validExpense, expenseDate: '11/12/2026' }).success,
    ).toBe(false);
  });

  it('accepts an expense date outside the trip range', () => {
    // Deliberate: a flight booked in August for a December trip is a real
    // expense on a real date.
    expect(
      createExpenseSchema.safeParse({ ...validExpense, expenseDate: '2026-08-01' }).success,
    ).toBe(true);
  });

  // ----- Participants -----

  it('rejects an empty participant list', () => {
    // splitEqually would divide by zero. Catching it here makes it a 422.
    expect(createExpenseSchema.safeParse({ ...validExpense, participantIds: [] }).success).toBe(
      false,
    );
  });

  it('rejects duplicate participants', () => {
    // ExpenseParticipant has @@unique([expenseId, userId]). A duplicate would
    // reach Prisma, raise P2002, and surface as a 500.
    expect(
      createExpenseSchema.safeParse({ ...validExpense, participantIds: [USER_A, USER_A] }).success,
    ).toBe(false);
  });

  it('rejects a participant id that is not a uuid', () => {
    expect(
      createExpenseSchema.safeParse({ ...validExpense, participantIds: ['not-a-uuid'] }).success,
    ).toBe(false);
  });

  it('accepts a payer who is not a participant', () => {
    // Someone can pay for a meal they did not eat. That imbalance is exactly
    // what the settlement feature exists to resolve.
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      paidById: USER_A,
      participantIds: [USER_B, USER_C],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing payer', () => {
    const { paidById, ...withoutPayer } = validExpense;
    void paidById;
    expect(createExpenseSchema.safeParse(withoutPayer).success).toBe(false);
  });

  it('ignores client-supplied shares rather than trusting them', () => {
    // The server computes the split. Shares arriving in a request body could
    // be made not to add up, and nothing downstream would notice until a
    // settlement screen refused to balance. Zod strips unknown keys.
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      shares: [{ userId: USER_A, shareCents: 999999 }],
    });
    expect(result.success).toBe(true);
    expect(result.success && 'shares' in result.data).toBe(false);
  });
});

// -------------------- Update Schema --------------------

describe('updateExpenseSchema', () => {
  it('accepts a single field', () => {
    expect(updateExpenseSchema.safeParse({ title: 'Gas and snacks' }).success).toBe(true);
  });

  it('accepts an amount on its own', () => {
    // The controller re-splits against the stored participants.
    expect(updateExpenseSchema.safeParse({ amountCents: 7500 }).success).toBe(true);
  });

  it('accepts participants on their own', () => {
    // The controller re-splits against the stored amount.
    expect(updateExpenseSchema.safeParse({ participantIds: [USER_A, USER_B] }).success).toBe(true);
  });

  it('rejects an empty body', () => {
    // Almost always a client bug. A clear message beats a silent no-op the
    // caller has to debug.
    expect(updateExpenseSchema.safeParse({}).success).toBe(false);
  });

  it('accepts null to clear the description', () => {
    expect(updateExpenseSchema.safeParse({ description: null }).success).toBe(true);
  });

  it('still rejects a fractional amount', () => {
    // Every field rule from the base schema survives .partial().
    expect(updateExpenseSchema.safeParse({ amountCents: 62.5 }).success).toBe(false);
  });

  it('still rejects duplicate participants', () => {
    expect(updateExpenseSchema.safeParse({ participantIds: [USER_A, USER_A] }).success).toBe(false);
  });

  it('still rejects an empty participant list', () => {
    expect(updateExpenseSchema.safeParse({ participantIds: [] }).success).toBe(false);
  });
});

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
