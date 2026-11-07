
// -------------------- Type imports --------------------

import type {
  ItineraryEventDetailResponse,
  ItineraryResponse,
} from '../types/api';

// -------------------- Module and lib imports --------------------

import { get } from '../lib/api';

// -------------------- Service Functions --------------------

/** GET /api/trips/:tripId/itinerary */
export function fetchItinerary(
  tripId: string,
): Promise<ItineraryResponse> {
  return get<ItineraryResponse>(
    `/trips/${tripId}/itinerary`,
  );
}

export function fetchItineraryEvent(
  tripId: string,
  itineraryEventId: string,
): Promise<ItineraryEventDetailResponse> {
  return get<ItineraryEventDetailResponse>(
    `/trips/${tripId}/itinerary/${itineraryEventId}`,
  );
}
