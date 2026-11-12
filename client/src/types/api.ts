/**
 * FILE: api.ts
 * DESCRIPTION: Response shapes returned by our API.
 *
 *              These are HAND-WRITTEN and mirror what the server sends.
 *              If you change a controller's select or response envelope,
 *              update the matching type here.

 * LAST UPDATED: 2026-11-06 - Add Activities detail response types (Brandon Douglass)
 *               2026-11-04 - Add Reservations response types (Antony Benitez)
 *               2026-11-03 - Add Activities list response types (Brandon Douglass)
 *               2026-10-16 - Add destination address and coordinates (Josh Iehle)
 *               2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Shared --------------------

export type TripRole = 'OWNER' | 'MEMBER';

export type TripStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

export interface UserSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

// -------------------- Users --------------------

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

export interface TripListItem {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  memberCount: number;
  yourRole: TripRole | null;
}

export interface TripListResponse {
  trips: TripListItem[];
}

export interface TripMemberSummary {
  role: TripRole;
  joinedAt: string;
  user: UserSummary;
}

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

export interface TripDetailResponse {
  trip: TripDetail;
  yourRole: TripRole;
}

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

export type UpdateTripBody = Partial<CreateTripBody>;

// -------------------- Expenses --------------------

export interface ExpenseListItem {
  id: string;
  title: string;
  expenseDate: string;
  amountCents: number;
  paidBy: UserSummary;
  participantCount: number;
}

export interface ExpenseListResponse {
  expenses: ExpenseListItem[];
  totalCents: number;
}

export interface ExpenseParticipantSummary {
  id: string;
  shareCents: number;
  user: UserSummary;
}

export interface ExpenseDetail {
  id: string;
  title: string;
  description: string | null;
  expenseDate: string;
  amountCents: number;
  paidBy: UserSummary;
  activity: { id: string; name: string } | null;
  reservation: { id: string; name: string } | null;
  participants: ExpenseParticipantSummary[];
}

export interface ExpenseDetailResponse {
  expense: ExpenseDetail;
}

export interface CreateExpenseBody {
  title: string;
  amountCents: number;
  expenseDate: string;
  paidById: string;
  participantIds: string[];
  description?: string | null;
}

export type UpdateExpenseBody = Partial<CreateExpenseBody>;

// -------------------- Activities --------------------

export interface ActivityListItem {
  id: string;
  name: string;
  locationName: string | null;
  estimatedCostCents: number | null;
  suggestedDateTime: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    displayName: string;
  };
  voteLength: number;
  hasVoted: boolean;
}

export interface ActivityListResponse {
  activities: ActivityListItem[];
}
/** Full activity information returned by the detail endpoint. */
export interface ActivityDetail {
  id: string;
  name: string;
  description: string | null;
  suggestedDateTime: string | null;
  locationName: string | null;
  locationAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  estimatedCostCents: number | null;
  createdAt: string;
  createdBy: {
    id: string;
    displayName: string;
  };
  voteCount: number;
  hasVoted: boolean;
}

/** GET /api/trips/:tripId/activities/:activityId */
export interface ActivityDetailResponse {
  activity: ActivityDetail;
}

// -------------------- Reservations --------------------

/** Reservation categories supported by the backend. */
export type ReservationType =
  'FLIGHT' | 'HOTEL' | 'RENTAL_CAR' | 'RESTAURANT' | 'ATTRACTION' | 'OTHER';

/** One reservation returned by the list endpoint. */
export interface ReservationListItem {
  id: string;
  type: ReservationType;
  name: string;
  confirmationNumber: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  locationName: string | null;
  costCents: number | null;
}

/** GET /api/trips/:tripId/reservations */
export interface ReservationListResponse {
  reservations: ReservationListItem[];
}

// -------------------- Reservation Detail (R4) --------------------

/** Full reservation information returned by the detail endpoint. */
export interface ReservationDetail {
  id: string;
  type: ReservationType;
  name: string;
  confirmationNumber: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  locationName: string | null;
  locationAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  costCents: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /api/trips/:tripId/reservations/:reservationId */
export interface ReservationDetailResponse {
  reservation: ReservationDetail;
}