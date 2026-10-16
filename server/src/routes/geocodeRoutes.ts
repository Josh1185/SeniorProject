/**
 * FILE: geocodeRoutes.ts
 * DESCRIPTION: The router for the Mapbox proxy.
 *
 *              NOT SCOPED TO A TRIP. These two endpoints are mounted at
 *              /api/geocode, not /api/trips/:tripId/geocode, because searching
 *              for a place is not a thing you do to a trip - it is a lookup
 *              that the activity form, the reservation form and the trip form
 *              all need. There is therefore no requireTripRole here; requireAuth
 *              at the mount point is the whole guard.
 *
 *              Both are GETs with no side effects, so they are safely cacheable
 *              and safely retried.
 *
 * LAST UPDATED: 2026-10-15 - File Created (Josh Iehle)
 */

// -------------------- Module Imports --------------------
import { Router } from 'express';

// -------------------- Controller Imports --------------------
import { getStaticMap, searchLocations } from '../controllers/geocodeController';

// -------------------- Router Instance --------------------
export const geocodeRouter = Router();

// -------------------- Routes --------------------
geocodeRouter.get('/search', searchLocations);
geocodeRouter.get('/static', getStaticMap);
