/**
 * FILE: reservationSchemas.ts
 * DESCRIPTION: Zod validation schemas for the reservation module.
 */

// -------------------- Module Imports --------------------
import { z } from 'zod';

// -------------------- Shared Rules --------------------

const emptyToUndefined = (value: unknown) =>
  value === '' ? undefined : value;

// -------------------- List Query Schema --------------------

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

export type ListReservationsQuery = z.infer<
  typeof listReservationsQuerySchema
>;