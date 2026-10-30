/**
 * FILE: activitySchemas.ts
 * DESCRIPTION: Validates search and sorting options for the activities API
 *
 * LAST UPDATED: 2026-10-24 - Code Review Refactor (Josh Iehle)
 *               2026-10-19 - Add activity list query schema (Brandon Douglass)
 */

// -------------------- Module imports --------------------
import { z } from 'zod';

// -------------------- List Query Schemas --------------------

// Treat empty URL parameters as if they were not provided.
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

// Validate the options sent when requesting a list of activities.
export const listActivitiesQuerySchema = z.object({
  // Optional search text, limited to 100 characters.
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => (value ? value : undefined)),

  // Choose which activity field to sort by.
  // Default to the date the activity was created.
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(['name', 'votes', 'createdAt']).default('createdAt'),
  ),

  // Choose ascending or descending order.
  // Default to descending (newest or highest first).
  order: z.preprocess(
    emptyToUndefined,
    z.enum(['asc', 'desc']).default('desc'),
  ),
});

// Reuse the validated query type in our activity controller.
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;
