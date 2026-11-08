// -------------------- Type imports --------------------

import type {
  CreateItineraryEventBody,
  ItineraryEventDetailResponse,
  ItineraryResponse,
  UpdateItineraryEventBody,
} from '../types/api';

// -------------------- Module and lib imports --------------------

import { del, get, patch, post } from '../lib/api';

// -------------------- Service Functions --------------------

/** GET /api/trips/:tripId/itinerary */
export function fetchItinerary(
  tripId: string,
): Promise<ItineraryResponse> {
  return get<ItineraryResponse>(
    `/trips/${tripId}/itinerary`,
  );
}

/** GET /api/trips/:tripId/itinerary/:eventId */
export function fetchItineraryEvent(
  tripId: string,
  itineraryEventId: string,
): Promise<ItineraryEventDetailResponse> {
  return get<ItineraryEventDetailResponse>(
    `/trips/${tripId}/itinerary/${itineraryEventId}`,
  );
}

/** POST /api/trips/:tripId/itinerary */
export function createItineraryEvent(
  tripId: string,
  body: CreateItineraryEventBody,
) {
  return post<{ event: ItineraryEventDetailResponse['itineraryEvent'] }>(
    `/trips/${tripId}/itinerary`,
    body,
  );
}

/** PATCH /api/trips/:tripId/itinerary/:eventId */
export function updateItineraryEvent(
  tripId: string,
  itineraryEventId: string,
  body: UpdateItineraryEventBody,
) {
  return patch<{ event: ItineraryEventDetailResponse['itineraryEvent'] }>(
    `/trips/${tripId}/itinerary/${itineraryEventId}`,
    body,
  );
}

/** DELETE /api/trips/:tripId/itinerary/:eventId */
export function deleteItineraryEvent(
  tripId: string,
  itineraryEventId: string,
): Promise<void> {
  return del(
    `/trips/${tripId}/itinerary/${itineraryEventId}`,
  );
}
