/**
 * FILE: format.ts
 * DESCRIPTION: Display formatting shared across features.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
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
