
/**
 * FILE: itineraryDateRange.ts
 * DESCRIPTION: Validates itinerary event dates against a trip's date range
 *              using the event creator's local time zone.
 */

// -------------------- Function --------------------

/**
 * Checks whether an event timestamp falls within a trip's inclusive
 * date range when interpreted in the supplied IANA time zone.
 *
 * Trip boundaries are database date values. Event timestamps are
 * absolute instants and must be converted to the supplied time zone
 * before comparing calendar dates.
 *
 * Throws RangeError when the supplied time zone is invalid.
 */
export function isWithinTripDateRange(
  eventDateTime: Date,
  timeZone: string,
  tripStartDate: Date,
  tripEndDate: Date,
): boolean {
  if (
    Number.isNaN(eventDateTime.getTime()) ||
    Number.isNaN(tripStartDate.getTime()) ||
    Number.isNaN(tripEndDate.getTime())
  ) {
    return false;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(eventDateTime);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return false;
  }

  const eventDate = `${year}-${month}-${day}`;
  const startDate = tripStartDate.toISOString().slice(0, 10);
  const endDate = tripEndDate.toISOString().slice(0, 10);

  return eventDate >= startDate && eventDate <= endDate;
}
