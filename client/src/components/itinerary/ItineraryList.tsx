import { useState } from 'react';

import type {
  ItineraryDay,
  ItineraryEvent,
  ItineraryEventDetail,
} from '../../types/api';

import { EmptyState } from '../list/EmptyState';
import { ItineraryEventDetailModal } from './ItineraryEventDetailModal';
import { ItineraryEventFormModal } from './ItineraryEventFormModal';
import { formatDate } from '../../lib/format';

// -------------------- Props Interface --------------------

interface ItineraryListProps {
  tripId: string | undefined;
  startDate: string;
  endDate: string;
  events: ItineraryEvent[];
}

// -------------------- Date Helpers --------------------

function getLocalDateKey(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTripDays(startDate: string, endDate: string): ItineraryDay[] {
  const days: ItineraryDay[] = [];

  const [startYear, startMonth, startDay] = startDate
    .split('-')
    .map(Number);

  const [endYear, endMonth, endDay] = endDate
    .split('-')
    .map(Number);

  const current = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');

    const date = `${year}-${month}-${day}`;

    days.push({
      date,
      events: [],
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
}

function formatEventTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// -------------------- Component --------------------

export function ItineraryList({
  tripId,
  startDate,
  endDate,
  events,
}: ItineraryListProps) {
  const [selectedEventId, setSelectedEventId] = useState<
    string | undefined
  >(undefined);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<
  ItineraryEventDetail | undefined
>(undefined);

  const selectedEvent = events.find(
    (event) => event.id === selectedEventId,
  );
  function handleEdit(event: ItineraryEventDetail) {
  setEditingEvent(event);
  setSelectedEventId(undefined);
}

  const days = getTripDays(startDate, endDate);

  const daysByDate = new Map(
    days.map((day) => [day.date, day]),
  );

  events.forEach((event) => {
    const localDate = getLocalDateKey(event.startDateTime);
    const matchingDay = daysByDate.get(localDate);

    if (matchingDay) {
      matchingDay.events.push(event);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          disabled={!tripId}
          className="cursor-pointer rounded-md border border-ink-300 bg-ink-50 px-4 py-2 text-sm font-medium text-ink-900 duration-150 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add Event
        </button>
      </div>

      {days.length === 0 ? (
        <EmptyState
          title="No itinerary available"
          description="There are no days to display for this trip."
        />
      ) : (
        days.map((day) => {
          const sortedEvents = [...day.events].sort(
            (a, b) =>
              new Date(a.startDateTime).getTime() -
              new Date(b.startDateTime).getTime(),
          );

          return (
            <section
              key={day.date}
              className="rounded-lg border border-ink-300 p-5"
            >
              <h3 className="mb-4 font-semibold text-ink-900">
                {formatDate(day.date)}
              </h3>

              {sortedEvents.length === 0 ? (
                <p className="text-sm text-ink-700">
                  No events scheduled for this day.
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedEvents.map((event) => (
                    <button
                      type="button"
                      key={event.id}
                      onClick={() => setSelectedEventId(event.id)}
                      className="w-full rounded-md bg-ink-100 p-4 text-left transition hover:bg-ink-200 focus:outline-none focus:ring-2 focus:ring-ink-500"
                    >
                      <h4 className="font-medium text-ink-900">
                        {event.title}
                      </h4>

                      <p className="mt-1 text-sm text-ink-700">
                        {formatEventTime(event.startDateTime)}
                        {event.endDateTime &&
                          ` - ${formatEventTime(event.endDateTime)}`}
                      </p>

                      {event.locationName && (
                        <p className="mt-1 text-sm text-ink-700">
                          {event.locationName}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}

      <ItineraryEventFormModal
  key="create-event"
  open={isCreateOpen}
  tripId={tripId}
  startDate={startDate}
  endDate={endDate}
  onClose={() => setIsCreateOpen(false)}
/>

      <ItineraryEventDetailModal
  tripId={tripId}
  itineraryEventId={selectedEventId}
  eventTitle={selectedEvent?.title ?? 'Itinerary Event'}
  onClose={() => setSelectedEventId(undefined)}
  onEdit={handleEdit}
/>

<ItineraryEventFormModal
  key={editingEvent?.id ?? 'edit-event'}
  open={Boolean(editingEvent)}
  tripId={tripId}
  startDate={startDate}
  endDate={endDate}
  event={editingEvent}
  onClose={() => setEditingEvent(undefined)}
/>
    </div>
  );
}
