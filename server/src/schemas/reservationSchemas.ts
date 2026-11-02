/**
 * FILE: reservationSchemas.ts
 * DESCRIPTION: Zod validation schemas for the reservation module.
 *
 * LAST UPDATED: 2026-10-30 - Add create and update schemas (Antony Benitez)
 *               2026-10-28 - File Created (Antony Benitez)
 */

// -------------------- Module Imports --------------------
import { z } from 'zod';

// -------------------- Shared Rules --------------------

/**
 * Treats an empty query parameter as absent.
 */
const emptyToUndefined = (value: unknown) =>
  value === '' ? undefined : value;

/**
 * Maximum value supported by PostgreSQL's Int type.
 * Reservation costs are stored in cents.
 */
const MAX_COST_CENTS = 2_147_483_647;

// -------------------- Shared Field Definitions --------------------

/**
 * Fields used when creating or updating reservations.
 *
 * These fields are shared so POST and PATCH use the same
 * validation rules.
 */
const reservationFields = z.object({
  // Reservation category
  type: z.enum([
    'FLIGHT',
    'HOTEL',
    'RENTAL_CAR',
    'RESTAURANT',
    'ATTRACTION',
    'OTHER',
  ]),

  // Reservation name
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(200),

  // Optional booking confirmation number
  confirmationNumber: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional(),

  // Optional reservation start and end times
  startDateTime: z
    .iso.datetime({ offset: true })
    .nullable()
    .optional(),

  endDateTime: z
    .iso.datetime({ offset: true })
    .nullable()
    .optional(),

  // Optional location details
  locationName: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional(),

  locationAddress: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional(),

  // Optional geographical coordinates
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .nullable()
    .optional(),

  longitude: z
    .number()
    .min(-180)
    .max(180)
    .nullable()
    .optional(),

  // Optional reservation cost in cents
  costCents: z
    .number()
    .int('Cost must be a whole number of cents')
    .min(0, 'Cost cannot be negative')
    .max(MAX_COST_CENTS)
    .nullable()
    .optional(),

  // Optional reservation notes
  notes: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional(),
});

// -------------------- Create Schema --------------------

/**
 * POST /api/trips/:tripId/reservations
 *
 * Requires a reservation type and name.
 * All other fields are optional.
 */
export const createReservationSchema = reservationFields;

export type CreateReservationInput =
  z.infer<typeof createReservationSchema>;

// -------------------- Update Schema --------------------

/**
 * PATCH /api/trips/:tripId/reservations/:reservationId
 *
 * Every field is optional because PATCH updates only
 * the information provided by the user.
 *
 * An empty request body is rejected.
 */
export const updateReservationSchema = reservationFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export type UpdateReservationInput =
  z.infer<typeof updateReservationSchema>;

// -------------------- List Query Schema --------------------

/**
 * GET /api/trips/:tripId/reservations
 *
 * Supports searching, filtering, and sorting reservations.
 */
export const listReservationsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),

  type: z.preprocess(
    emptyToUndefined,
    z.enum([
      'FLIGHT',
      'HOTEL',
      'RENTAL_CAR',
      'RESTAURANT',
      'ATTRACTION',
      'OTHER',
    ]).optional(),
  ),

  sort: z.preprocess(
    emptyToUndefined,
    z.enum(['name', 'startDateTime', 'createdAt']).default('startDateTime'),
  ),

  order: z.preprocess(
    emptyToUndefined,
    z.enum(['asc', 'desc']).default('asc'),
  ),
});

export type ListReservationsQuery =
  z.infer<typeof listReservationsQuerySchema>;
