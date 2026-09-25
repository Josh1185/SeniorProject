/**
 * FILE: api.ts
 * DESCRIPTION: Universal API request builder
 *
 * LAST UPDATED: 2026-09-25 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { supabase } from "./supabase";

// -------------------- API Base URL Resolution --------------------
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

// -------------------- API Error Class --------------------
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// -------------------- API Options Interface --------------------
interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

// -------------------- API Request builder function --------------------

/**
 * The single place requests get their auth header
 *
 * `getSession()` reads from storage and refreshes an expired token before returning,
 * so callers never think about expiry
 *
 * Every feature should go through this rather than calling fetch directly;
 * otherwise you end up with four different error-handling styles
 */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  // ----- 1. Extract body, headers, and any additional request options -----
  const { body, headers, ...rest } = options;

  // ----- 2. Retrieve Supabase session -----
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // ----- 3. Request the server -----
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}`} : {}),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  catch {
    throw new ApiError(0, 'Could not reach the server. Is the API running?');
  }

  // ----- 4. Handle 204 (No Content success) status code -----
  if (response.status === 204) return undefined as T;

  // ----- 5. Retrieve payload from request -----
  const payload = await response.json().catch(() => null);

  // ----- 6. Handle non-ok responses -----
  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.message ?? `Request failed (${response.status})`,
      payload?.error?.code,
    );
  }

  // ----- 7. Return the payload -----
  return payload as T;
}

// -------------------- Method Wrappers --------------------
export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body: unknown) => api<T>(path, { method: 'POST', body });
export const patch = <T>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body });
export const del = (path: string) => api<void>(path, { method: 'DELETE' });
