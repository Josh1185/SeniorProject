/**
 * FILE: expenseSchemas.ts
 * DESCRIPTION: Zod validation schemas for the expense module.
 *
 *
 * LAST UPDATED: 2026-10-18 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { z } from 'zod';

// -------------------- List Query Schemas --------------------

/**
 * Treats an empty query param as absent.
 */
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

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

  // Defaults reproduce the pre-filter behaviour: soonest trip first.
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(['title', 'expenseDate', 'createdAt']).default('expenseDate'),
  ),
  order: z.preprocess(emptyToUndefined, z.enum(['asc', 'desc']).default('desc')),
});

export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
