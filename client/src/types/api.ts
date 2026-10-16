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
 * LAST UPDATED: 2026-10-16 - Add destination address and coordinates (Josh Iehle)
 *               2026-10-11 - File Created (Josh Iehle)
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

/**
 * One row in GET /api/trips
 *
 * No address or coordinates here on purpose: the list does not render a map, so
 * they are not in that endpoint's `select`. Keep the two in step - if you add
 * them to the controller, add them here.
 */
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

/**
 * The trip object inside TripDetailResponse, named separately so components
 * that take "a trip" (the edit form, for example) can type their prop.
 *
 * The address and coordinates are nullable: a destination typed by hand rather
 * than picked from the geocode search has none, and neither does any trip
 * created before those columns existed.
 *
 * Numbers, not strings. They are Prisma `Float` columns, which serialise as
 * JSON numbers. (A `Decimal` column would arrive as a string and need
 * converting at the boundary - one of the reasons they are Float.)
 */
export interface TripDetail {
  id: string;
  name: string;
  description: string | null;
  destination: string;
  destinationAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  endDate: string;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: UserSummary;
  members: TripMemberSummary[];
}

/** GET /api/trips/:tripId */
export interface TripDetailResponse {
  trip: TripDetail;
  yourRole: TripRole;
}

/**
 * POST /api/trips - mirrors createTripSchema on the server.
 * Dates are YYYY-MM-DD, which is what z.iso.date() accepts.
 *
 * The three location fields accept `null` as well as being optional, and the
 * difference matters on the PATCH below: omitting one leaves the column alone,
 * sending null clears it. That is how coordinates get removed from a trip whose
 * destination was re-typed by hand.
 */
export interface CreateTripBody {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  destinationAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** PATCH /api/trips/:tripId - every field optional. */
export type UpdateTripBody = Partial<CreateTripBody>;
