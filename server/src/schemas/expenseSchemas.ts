/**
 * FILE: expenseSchemas.ts
 * DESCRIPTION: Zod validation schemas for the expense module.
 *
 * LAST UPDATED: 2026-10-20 - Add create and update schemas (Josh Iehle)
 *               2026-10-18 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { z } from 'zod';

// -------------------- Shared Rules --------------------

/**
 * Treats an empty query param as absent.
 */
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

/**
 * The largest value a Postgres Int can hold: 2^31 - 1, about $21.4 million.
 *
 * Bounding it here turns an unreadable database error into a 422 that names
 * the field. Nobody will hit it legitimately; a client bug sending dollars
 * multiplied twice will.
 */
const MAX_AMOUNT_CENTS = 2_147_483_647;

/**
 * No participant may be listed twice.
 *
 * ExpenseParticipant has @@unique([expenseId, userId]), so a duplicate would
 * reach Prisma, raise P2002, and surface as a 500. Catching it here makes it
 * a 422 that says what is wrong.
 */
const allUnique = (ids: string[]) => new Set(ids).size === ids.length;

const allUniqueError = { message: 'Each participant may only be listed once' };

// -------------------- Shared Field Definitions --------------------

/**
 * The editable fields of an expense, with no cross-field rules attached.
 *
 * A plain z.object() on purpose, exactly as tripFields is: `.refine()` returns
 * a type with no `.partial()`, so create and update must BOTH be built from
 * this base rather than one from the other.
 */
const expenseFields = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),

  // Nullable AND optional, and the two mean different things on a PATCH:
  // `undefined` leaves the column alone, `null` clears it.
  description: z.string().trim().max(2000).nullable().optional(),

  // ----- Money -----
  // .int() is the whole point. The client sends 6200, never 62.00. A
  // fractional value here means someone passed dollars, which would be a
  // hundred-fold error silently written to the database - so it is a 422.
  //
  // .positive() rather than .min(0): an expense of nothing is a client bug.
  amountCents: z
    .number()
    .int('Amount must be a whole number of cents')
    .positive('Amount must be greater than zero')
    .max(MAX_AMOUNT_CENTS),

  // z.iso.date() accepts YYYY-MM-DD only, matching the @db.Date column.
  //
  // Deliberately NOT constrained to the trip's date range: a flight booked in
  // August for a December trip is a real expense on a real date.
  expenseDate: z.iso.date(),

  // ----- Who paid -----
  // Required, never defaulted to the caller. The form has a "paid by" field,
  // and an implicit default would silently attribute an expense to the wrong
  // person whenever a client forgot to send it - which corrupts every balance
  // derived from it, with nothing to show that it happened.
  paidById: z.uuid(),

  // ----- Who it is split between -----
  // The payer does NOT have to be in here. Someone can pay for a meal they
  // did not eat, and that is exactly the case the settlement feature exists
  // to resolve.
  //
  // The shares themselves are NOT accepted from the client; the server
  // computes them with splitEqually so the sum is exact by construction.
  // Uneven splits, when they arrive, will add an optional shares array here.
  participantIds: z
    .array(z.uuid())
    .min(1, 'An expense needs at least one participant')
    .max(50)
    .refine(allUnique, allUniqueError),
});

// -------------------- Create Schema --------------------

/**
 * POST /api/trips/:tripId/expenses
 */
export const createExpenseSchema = expenseFields;

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// -------------------- Update Schema --------------------

/**
 * PATCH /api/trips/:tripId/expenses/:expenseId
 *
 * Every field optional. Two things worth knowing about the semantics:
 *
 *   - `participantIds` REPLACES the participant set wholesale. There is no
 *     add-one or remove-one; send the full list you want.
 *
 *   - Sending either `amountCents` or `participantIds` re-splits the expense
 *     from scratch. The controller does that inside a transaction, because
 *     the invariant "shares sum to the amount" has to survive the update, not
 *     just the create.
 */
export const updateExpenseSchema = expenseFields
  .partial()
  // An empty body is almost always a client bug. Rejecting it with a clear
  // message beats a silent no-op the caller has to debug.
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// -------------------- List Query Schemas --------------------

/**
 * GET /api/trips/:tripId/expenses?search=&sort=&order=
 */
export const listExpensesQuerySchema = z.object({
  // Matched against the expense title, case-insensitively.
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => (value ? value : undefined)),

  // Most recent spending first. An expense list is a record of what already
  // happened, so newest-first is the useful default - deliberately the
  // opposite of the trip list, where soonest-first is what you want.
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(['title', 'expenseDate', 'createdAt']).default('expenseDate'),
  ),
  order: z.preprocess(emptyToUndefined, z.enum(['asc', 'desc']).default('desc')),
});

export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
