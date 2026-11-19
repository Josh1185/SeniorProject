/**
 * FILE: format.ts
 * DESCRIPTION: Display formatting shared across features.
 *
 * LAST UPDATED: 2026-11-12 - Add local date/time conversion utilities (Brandon Douglass)
                 2026-10-13 - File Created (Josh Iehle)
 */

/**
 * "2026-11-12T00:00:00.000Z" -> "11/12/26"
 *
 * The server sends @db.Date columns as full ISO timestamps, so the time part
 * is stripped before parsing. Re-parsing with an explicit T00:00:00 and NO
 * timezone forces LOCAL midnight - parsing the raw UTC string and formatting
 * locally would show the previous day for anyone west of Greenwich.
 */
export function formatDate(value: string | undefined | null): string {
  if (!value) return '';

  const [datePart] = value.split('T');
  if (!datePart) return '';

  const date = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  });
}

/** "4/7/27 - 4/14/27" */
export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * The value an <input type="date"> expects: YYYY-MM-DD, nothing else.
 * Used to prefill the edit form from an API response.
 */
export function toDateInputValue(value: string | undefined | null): string {
  if (!value) return '';
  return value.split('T')[0] ?? '';
}

/**
 * Converts an API timestamp into the local date/time format expected by
 * <input type="datetime-local">.
 */
export function toDateTimeInputValue(value: string | undefined | null): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a local datetime input value into an ISO timestamp with timezone.
 * Returns null when the field is empty.
 */
export function toISOStringFromLocal(value: string): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date/time.');
  }

  return date.toISOString();
}

/**
 * 1250 -> "$12.50". Takes CENTS, always - the whole codebase stores integer
 * cents, and a function that silently accepted dollars would be a quiet
 * hundred-fold bug.
 */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}
