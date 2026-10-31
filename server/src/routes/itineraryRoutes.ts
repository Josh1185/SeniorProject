/**
 * FILE: itineraryRoutes.ts
 * DESCRIPTION: The router for itinerary module endpoints
 *
 * LAST UPDATED: 2026-10-29 - File Created (Christopher Soliman)
 */

// -------------------- Module Imports --------------------
import { Router } from 'express';

// -------------------- Controller Imports --------------------
import {
  getItinerary,
  getItineraryEventById,
} from '../controllers/itineraryController';

// -------------------- Router Instance --------------------
export const itineraryRouter = Router({ mergeParams: true });

// -------------------- Collection Routes --------------------
itineraryRouter.get('/', getItinerary);

// -------------------- Single Itinerary Event Routes --------------------
itineraryRouter.get('/:itineraryEventId', getItineraryEventById);
