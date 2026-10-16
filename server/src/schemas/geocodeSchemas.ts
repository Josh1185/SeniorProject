/**
 * FILE: geocodeSchemas.ts
 * DESCRIPTION: Zod validation schemas for the geocode proxy.
 *
 *              Both endpoints take their input from the query string, so every
 *              value arrives as a string and anything numeric needs coercion -
 *              hence z.coerce.number() on the coordinates rather than z.number().
 *
 *              The clamping here is not cosmetic. These values are interpolated
 *              into an outbound Mapbox URL, so each one is bounded to what the
 *              API actually accepts. A caller cannot widen the request, ask for
 *              a 4000x4000 image, or push anything but a number into the path.
 *
 * LAST UPDATED: 2026-10-15 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { z } from 'zod';

// -------------------- Shared Field Definitions --------------------

/**
 * Longitude before latitude is Mapbox's ordering and the source of most
 * coordinate bugs in map code. Our own API, types and database columns all use
 * `lat` then `lng` by name, so the only place the order matters is the one line
 * that builds the Mapbox URL.
 */
const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

// -------------------- Forward Geocode Schema --------------------

/**
 * GET /api/geocode/search?q=&limit=
 *
 * `q` has a minimum length because a one-character search returns noise and
 * still costs a billable Mapbox request. The client also waits for the debounce
 * before calling, but the server does not get to assume the client behaved.
 */
export const geocodeSearchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Search for at least two characters').max(200),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export type GeocodeSearchQuery = z.infer<typeof geocodeSearchQuerySchema>;

// -------------------- Static Map Schema --------------------

/**
 * GET /api/geocode/static?lat=&lng=&zoom=&width=&height=
 *
 * Sizes are capped at Mapbox's own 1280px limit. The @2x suffix the controller
 * adds doubles the pixels delivered, so a 640px request is a 1280px image -
 * which is why the cap here is 640 rather than 1280.
 */
export const staticMapQuerySchema = z.object({
  lat: latitude,
  lng: longitude,
  zoom: z.coerce.number().min(0).max(22).default(12),
  width: z.coerce.number().int().min(80).max(640).default(600),
  height: z.coerce.number().int().min(80).max(640).default(300),
});

export type StaticMapQuery = z.infer<typeof staticMapQuerySchema>;
