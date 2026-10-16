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
 * LAST UPDATED: 2026-10-16 - Add destination address and coordinates (Josh Iehle)
 *               2026-10-11 - Add list query schema (Josh Iehle)
 *               2026-10-09 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { z } from 'zod';

// -------------------- Cross-Field Rules --------------------

/**
 * Latitude and longitude are meaningless on their own, so they travel together.
 *
 * `== null` rather than `=== null` on purpose: it is true for null AND
 * undefined, which is exactly the distinction that does NOT matter here. Both
 * absent passes, both present passes, one of each fails.
 *
 * Shared by the create and update schemas below rather than written twice,
 * because a rule defined in two places is a rule that will disagree with
 * itself.
 */
const coordinatesPaired = (data: { latitude?: number | null; longitude?: number | null }) =>
  (data.latitude == null) === (data.longitude == null);

const coordinatesPairedError = {
  message: 'Latitude and longitude must be provided together',
  path: ['latitude'],
};

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

  // ----- The destination's address and coordinates -----
  // Filled in when the destination is picked from a geocode search; left empty
  // when it is typed by hand. All three are therefore nullable AND optional,
  // and those two mean different things on a PATCH: `undefined` leaves the
  // column alone, `null` clears it. Both are legitimate requests.
  //
  // z.number(), not z.coerce.number(): the client sends JSON, so a coordinate
  // arrives as a real number. A string here means something built the request
  // wrong, and that is worth a 422 rather than a silent coercion.
  //
  // The bounds are real-world latitude and longitude, so a transposed pair -
  // 81 and 28 the wrong way round - is caught here rather than pinning the map
  // in the Arctic.
  destinationAddress: z.string().trim().max(300).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),

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
export const createTripSchema = tripFields
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  })
  .refine(coordinatesPaired, coordinatesPairedError);

export type CreateTripInput = z.infer<typeof createTripSchema>;

// -------------------- Update Schema --------------------

/**
 * PATCH /api/trips/:tripId
 *
 * Every field optional (PATCH is a partial update, never a full replacement),
 * with three rules layered on top.
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
  )
  // Unlike the dates, this one is NOT re-checked against stored values in the
  // controller. The client always sets both coordinates together or clears
  // both together, so a request carrying one without the other is a client bug
  // worth rejecting outright rather than merging.
  .refine(coordinatesPaired, coordinatesPairedError);

export type UpdateTripInput = z.infer<typeof updateTripSchema>;

// -------------------- List Query Schemas --------------------

/**
 * Treats an empty query param as absent.
 *
 * A select or text input that the user clears sends `?status=` rather than
 * omitting the key, and an empty string is not a valid enum member. Without
 * this the UI would 422 the moment someone cleared a filter. Normalising here
 * is kinder than making every client remember to strip empty values.
 */
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

/**
 * GET /api/trips?search=&status=&role=&sort=&order=
 *
 * Note that EVERY query param arrives as a string, so anything non-string
 * needs coercion. These are all strings or enums, so none is needed here -
 * but a `?page=2` would need z.coerce.number().
 *
 * This is the pattern every other list endpoint should copy. Activities,
 * reservations and itinerary events all want some subset of the same controls.
 */
export const listTripsQuerySchema = z.object({
  // Matched against name OR destination, case-insensitively.
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => (value ? value : undefined)),

  // Derived from dates rather than stored, so the controller translates this
  // into date predicates via statusDateFilter(). See utils/tripStatus.ts.
  status: z.preprocess(emptyToUndefined, z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED']).optional()),

  // "trips I own" vs "trips I was invited to".
  role: z.preprocess(emptyToUndefined, z.enum(['OWNER', 'MEMBER']).optional()),

  // Defaults reproduce the pre-filter behaviour: soonest trip first.
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(['name', 'startDate', 'createdAt']).default('startDate'),
  ),
  order: z.preprocess(emptyToUndefined, z.enum(['asc', 'desc']).default('asc')),
});

export type ListTripsQuery = z.infer<typeof listTripsQuerySchema>;
