/**
 * FILE: tripRoutes.ts
 * DESCRIPTION: The router for trip module endpoints
 *
 *              NOTE ON MOUNTING: this router is mounted at /api/trips and owns
 *              its own :tripId segment, so it does NOT need mergeParams.
 *
 *              Feature routers are different. They mount UNDER the trip id:
 *
 *                app.use('/api/trips/:tripId/activities',
 *                  requireAuth, requireTripRole(), activityRouter);
 *
 *              In that case :tripId belongs to the MOUNT path, not the router,
 *              so the router must be created with mergeParams or
 *              req.params.tripId is undefined inside every handler:
 *
 *                export const activityRouter = Router({ mergeParams: true });
 *
 * LAST UPDATED: 2026-10-10 - File Created (Josh Iehle)
 */

// -------------------- Module Imports --------------------
import { Router } from 'express';

// -------------------- Middleware imports --------------------
import { requireTripRole } from '../middleware/tripRole';

// -------------------- Controller Imports --------------------
import {
  createTrip,
  deleteTrip,
  getTripById,
  listTrips,
  updateTrip,
} from '../controllers/tripController';

// -------------------- Router Instance --------------------
export const tripRouter = Router();

// -------------------- Collection Routes --------------------
/**
 * No requireTripRole on these two: there is no :tripId to scope to yet.
 *
 * - listTrips is authorized by its `where` clause (membership IS the filter)
 * - createTrip needs no trip permission, any signed-in user may create one
 */
tripRouter.get('/', listTrips);
tripRouter.post('/', createTrip);

// -------------------- Single-Trip Routes --------------------
/**
 * Guards are applied PER ROUTE rather than to the whole router, because the
 * required role differs: reading needs membership, writing needs ownership.
 *
 * Note the ordering - requireTripRole runs before the controller, so by the
 * time a controller executes the caller is known to be allowed.
 */
tripRouter.get('/:tripId', requireTripRole(), getTripById);
tripRouter.patch('/:tripId', requireTripRole('OWNER'), updateTrip);
tripRouter.delete('/:tripId', requireTripRole('OWNER'), deleteTrip);
