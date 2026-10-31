/**
 * FILE: activitySchemas.ts
 * DESCRIPTION: Zod validation for creating, updating, searching, and sorting activities.
 *
 * LAST UPDATED: 2026-10-30 - Add create and update activity schemas (Brandon Douglass)
 *               2026-10-24 - Code Review Refactor (Josh Iehle)
 *               2026-10-19 - Add activity list query schema (Brandon Douglass)
 */

// -------------------- Module imports --------------------
import { z } from 'zod';

// -------------------- Shared Field Definitions --------------------

// Fields users can provide when creating or editing an activity.
const activityFields = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().trim().max(2000).optional(),
  locationName: z.string().trim().max(200).nullable().optional(),
  locationAddress: z.string().trim().max(300).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  estimatedCostCents: z.number().int().min(0).nullable().optional(),
});

// -------------------- Create Schema --------------------

/**
 * POST /api/trips/:tripId/activities
 *
 * Validates the data required to create an activity.
 */
export const createActivitySchema = activityFields;

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

// -------------------- Update Schema --------------------

/**
 * PATCH /api/trips/:tripId/activities/:activityId
 *
 * Allows partial updates but rejects empty requests.
 */
export const updateActivitySchema = activityFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

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
  sort: z.preprocess(emptyToUndefined, z.enum(['name', 'votes', 'createdAt']).default('createdAt')),

  // Choose ascending or descending order.
  // Default to descending (newest or highest first).
  order: z.preprocess(emptyToUndefined, z.enum(['asc', 'desc']).default('desc')),
});

// Reuse the validated query type in our activity controller.
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;
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
