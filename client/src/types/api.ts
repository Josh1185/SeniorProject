/**
 * FILE: api.ts
 * DESCRIPTION: Response shapes returned by our API.
 *
 *              These are HAND-WRITTEN and mirror what the server sends. They
 *              are not generated, so if you change a controller's `select` or
 *              its response envelope, update the matching type here in the
 *              same commit. A type that lies is worse than no type - it tells
 *              TypeScript a field exists when it does not.
 *
 *              Each feature adds its own section. Keep them in the same order
 *              as the server's route modules.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Shared --------------------

export type TripRole = 'OWNER' | 'MEMBER';
export type TripStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

/** The subset of a user that the API embeds in other responses. */
export interface UserSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

// -------------------- Users --------------------

/** GET /api/users/me */
export interface SignedInUserResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    createdAt: string;
  };
}

// -------------------- Trips --------------------

/** One row in GET /api/trips */
export interface TripListItem {
  id: string;
  name: string;
  destination: string;
  /** ISO date strings. JSON has no Date type, so these arrive as strings. */
  startDate: string;
  endDate: string;
  status: TripStatus;
  memberCount: number;
  yourRole: TripRole | null;
}

/** GET /api/trips */
export interface TripListResponse {
  trips: TripListItem[];
}

/** A member row inside the trip detail response. */
export interface TripMemberSummary {
  role: TripRole;
  joinedAt: string;
  user: UserSummary;
}

/** GET /api/trips/:tripId */
export interface TripDetailResponse {
  trip: {
    id: string;
    name: string;
    description: string | null;
    destination: string;
    startDate: string;
    endDate: string;
    status: TripStatus;
    createdAt: string;
    updatedAt: string;
    createdBy: UserSummary;
    members: TripMemberSummary[];
  };
  yourRole: TripRole;
}
