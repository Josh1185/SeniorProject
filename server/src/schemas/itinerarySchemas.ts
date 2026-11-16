
/**
 * FILE: itinerarySchemas.ts
 * DESCRIPTION: Validation schemas for itinerary event requests.
 */

// -------------------- Module imports --------------------

import { z } from 'zod';

// -------------------- Shared Helpers --------------------

const coordinatesPaired = (data: {
  latitude?: number | null;
  longitude?: number | null;
}) => (data.latitude == null) === (data.longitude == null);

const coordinatesPairedError = {
  message: 'Latitude and longitude must be provided together',
  path: ['latitude'],
};

// -------------------- Shared Event Fields --------------------

const itineraryEventFields = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),

  description: z.string().trim().max(2000).nullable().optional(),

  startDateTime: z.iso.datetime(),

  endDateTime: z.iso.datetime().nullable().optional(),

  timeZone: z.string().trim().min(1, 'Time zone is required'),

  locationName: z.string().trim().max(200).nullable().optional(),

  locationAddress: z.string().trim().max(300).nullable().optional(),

  latitude: z.number().min(-90).max(90).nullable().optional(),

  longitude: z.number().min(-180).max(180).nullable().optional(),
});

// -------------------- Create Schema --------------------

export const createItineraryEventSchema = itineraryEventFields
  .refine(
    (data) =>
      data.endDateTime == null ||
      new Date(data.endDateTime) >= new Date(data.startDateTime),
    {
      message: 'End date/time must be on or after the start date/time',
      path: ['endDateTime'],
    },
  )
  .refine(coordinatesPaired, coordinatesPairedError);

export type CreateItineraryEventInput = z.infer<
  typeof createItineraryEventSchema
>;

// -------------------- Update Schema --------------------

export const updateItineraryEventSchema = itineraryEventFields
  .omit({ timeZone: true })
  .partial()
  .extend({
    timeZone: z.string().trim().min(1, 'Time zone is required'),
  })
  .refine(
    (data) => Object.keys(data).some((key) => key !== 'timeZone'),
    {
      message: 'Provide at least one field to update',
    },
  )
  .refine(
    (data) =>
      data.startDateTime === undefined ||
      data.endDateTime === undefined ||
      data.endDateTime == null ||
      new Date(data.endDateTime) >= new Date(data.startDateTime),
    {
      message: 'End date/time must be on or after the start date/time',
      path: ['endDateTime'],
    },
  )
  .refine(coordinatesPaired, coordinatesPairedError);

export type UpdateItineraryEventInput = z.infer<
  typeof updateItineraryEventSchema
>;
