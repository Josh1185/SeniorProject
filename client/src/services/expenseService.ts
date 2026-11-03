/**
 * FILE: expenseService.ts
 * DESCRIPTION: Every network call the expense module makes
 *
 * LAST UPDATED: 2026-11-02 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ExpenseListResponse, ExpenseDetailResponse } from '../types/api';

// -------------------- Module and lib imports --------------------
import { get } from '../lib/api';

// -------------------- List Filters --------------------

/**
 * Mirrors listExpensesQuerySchema on the server. Keeping the shapes aligned by
 * hand is the cost of not generating a client - when the server's schema
 * changes, change this too.
 *
 * `tripId` is NOT in here. It is a path segment, not a filter, and putting it
 * in this object would let it end up in a query string by accident.
 */
export interface ExpenseFilters {
  search?: string;
  sort?: 'title' | 'expenseDate' | 'createdAt';
  order?: 'asc' | 'desc';
}

/**
 * Builds the query string, skipping anything empty.
 *
 * Sending `?search=` would be harmless - the server normalises it away - but
 * sending nothing keeps the URL readable in devtools, which matters more than
 * it sounds when you are debugging why a filter did not apply.
 */
function toQueryString(filters: ExpenseFilters): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

// -------------------- Service Functions --------------------

/** GET /api/trips/:tripId/expenses */
export function fetchExpenses(
  tripId: string,
  filters: ExpenseFilters = {},
): Promise<ExpenseListResponse> {
  return get<ExpenseListResponse>(`/trips/${tripId}/expenses${toQueryString(filters)}`);
}

/** GET /api/trips/:tripId/expenses/:expenseId */
export function fetchExpense(
  tripId: string,
  expenseId: string,
): Promise<ExpenseDetailResponse> {
  return get<ExpenseDetailResponse>(`/trips/${tripId}/expenses/${expenseId}`);
}
