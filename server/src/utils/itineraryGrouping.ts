
export interface ItineraryDay<T> {
  date: string;
  events: T[];
}

interface ScheduledEvent {
  startDateTime: Date;
}

/**
 * Groups events by calendar date and includes every date in the trip range.
 * Dates are represented as YYYY-MM-DD strings.
 * Event timestamps are grouped by their UTC date.
 */
export function groupEventsByDay<T extends ScheduledEvent>(
  startDate: string,
  endDate: string,
  events: T[],
): ItineraryDay<T>[] {
  const days: ItineraryDay<T>[] = [];

  for (
    let date = startDate;
    date <= endDate;
    date = nextDate(date)
  ) {
    days.push({ date, events: [] });
  }

  const daysByDate = new Map(
    days.map((day) => [day.date, day]),
  );

  for (const event of events) {
    const eventDate = event.startDateTime.toISOString().slice(0, 10);
    const day = daysByDate.get(eventDate);

    if (day) {
      day.events.push(event);
    }
  }

  for (const day of days) {
    day.events.sort(
      (a, b) =>
        a.startDateTime.getTime() - b.startDateTime.getTime(),
    );
  }

  return days;
}

function nextDate(date: string): string {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}
