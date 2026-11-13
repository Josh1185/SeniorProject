
/**
 * FILE: ItineraryPage.tsx
 * DESCRIPTION: The trip's day-by-day itinerary and event management screen.
 */

// -------------------- Module and lib imports --------------------
import { useParams } from 'react-router';
import { useItinerary } from '../../hooks/itinerary/useItinerary';

// -------------------- Component imports --------------------
import { ItineraryList } from '../../components/itinerary/ItineraryList';

export function ItineraryPage() {
  // ----- 1. Route parameters -----
  const { tripId } = useParams();
  console.log('ItineraryPage tripId:', tripId);

  // ----- 2. Hook usage -----
  const itinerary = useItinerary(tripId);

  // ----- 3. Loading and error states -----
  if (itinerary.isLoading) {
    return <p className="text-ink-700">Loading itinerary…</p>;
  }

  if (itinerary.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-700">
          {(itinerary.error as Error).message}
        </p>

        <button
          type="button"
          onClick={() => void itinerary.refetch()}
          className="mt-3 text-sm font-medium text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!itinerary.data) return null;

  // ----- 4. Render -----
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Itinerary
        </h1>

        <p className="mt-1 text-sm text-ink-700">
          View and manage the events planned for each day of your trip.
        </p>
      </div>

      <ItineraryList
        tripId={tripId}
        startDate={itinerary.data.startDate}
        endDate={itinerary.data.endDate}
        events={itinerary.data.events}
      />
    </div>
  );
}
