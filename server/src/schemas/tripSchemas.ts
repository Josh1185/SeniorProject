/**
 * FILE: tripSchemas.ts
 * DESCRIPTION: Zod validation schemas for the trip module.
 *
 *              Schemas live in their own file, not inside the controller, for
 *              two reasons: they are pure and therefore trivially unit
 *              testable, and controllers stay readable when the validation
 *              rules are not inlined among the database calls.
 *
 *              Every feature module should follow this shape:
 *              schemas/<feature>Schemas.ts + schemas/<feature>Schemas.test.ts
 *
 * LAST UPDATED: 2026-10-09 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { z } from 'zod';

// -------------------- Shared Field Definitions --------------------

/**
 * The editable fields of a trip, with no cross-field rules attached yet.
 *
 * This is deliberately a plain object schema. `.refine()` returns a different
 * type that has no `.partial()` method, so the create and update schemas are
 * both built FROM this base rather than one from the other. Defining the
 * refinement here would make the update schema impossible to derive.
 */
const tripFields = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: z.string().trim().max(2000).optional(),
  destination: z.string().trim().min(1, 'Destination is required').max(200),

  // z.iso.date() accepts YYYY-MM-DD only, which is what a @db.Date column
  // stores. Accepting a full timestamp here would invite timezone bugs
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

// -------------------- Create Schema --------------------

/**
 * POST /api/trips
 *
 * Both dates are required, so the ordering rule can always be checked.
 * Comparing YYYY-MM-DD strings lexicographically is the same as comparing the
 * dates, which avoids parsing entirely.
 */
export const createTripSchema = tripFields.refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after the start date',
  path: ['endDate'],
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

// -------------------- Update Schema --------------------

/**
 * PATCH /api/trips/:tripId
 *
 * Every field optional (PATCH is a partial update, never a full replacement),
 * with two rules layered on top.
 */
export const updateTripSchema = tripFields
  .partial()
  // An empty body is almost always a client bug. Rejecting it with a clear
  // message beats a silent no-op the caller has to debug.
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  })
  // The ordering rule can only be enforced when BOTH dates are in the request.
  // Changing one date against a stored value is checked in the controller,
  // where the existing trip is available.
  .refine(
    (data) =>
      data.startDate === undefined || data.endDate === undefined || data.endDate >= data.startDate,
    {
      message: 'End date must be on or after the start date',
      path: ['endDate'],
    },
  );

export type UpdateTripInput = z.infer<typeof updateTripSchema>;
