import { Router } from 'express';
import { getItinerary } from '../controllers/itineraryController';

export const itineraryRouter = Router({ mergeParams: true });

itineraryRouter.get('/', getItinerary);
