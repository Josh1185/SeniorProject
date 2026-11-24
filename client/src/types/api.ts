/**
 * FILE: api.ts
 * DESCRIPTION: Response shapes returned by our API.
 *
 *              These are HAND-WRITTEN and mirror what the server sends.
 *              If you change a controller's select or response envelope,
 *              update the matching type here.

 * LAST UPDATED: 2026-11-12 - Add activity create/update request types (Brandon Douglass)
 *               2026-11-06 - Add Activities detail response types (Brandon Douglass)
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

// -------------------- Balances --------------------

/** One person's position on a trip. All figures are integer cents. */
export interface MemberBalance {
  user: UserSummary;
  /** Total this person paid out for the group. */
  paidCents: number;
  /** Total of this person's shares across every expense. */
  owedCents: number;
  /** paidCents - owedCents. Positive = owed money. Negative = owes money. */
  balanceCents: number;
  /**
   * False for someone removed from the trip who still has money in it.
   * Their expenses did not leave with them, so they stay in the balances.
   */
  isMember: boolean;
}

/** One payment in the settlement plan. Always positive, never self-to-self. */
export interface Settlement {
  from: UserSummary;
  to: UserSummary;
  amountCents: number;
}

/** GET /api/trips/:tripId/expenses/balances */
export interface BalancesResponse {
  /** Sorted by balance descending - whoever is owed most first. */
  balances: MemberBalance[];
  settlements: Settlement[];
  /** The caller's own balance, so the page does not have to find it. */
  yourBalanceCents: number;
}

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

/** POST /api/trips/:tripId/activities */
export interface CreateActivityBody {
  name: string;
  description?: string;
  suggestedDateTime?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  estimatedCostCents?: number | null;
}

/** PATCH /api/trips/:tripId/activities/:activityId */
export type UpdateActivityBody = Partial<CreateActivityBody>;

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

// -------------------- Reservation Writes (R5) --------------------

/** POST /api/trips/:tripId/reservations */
export interface CreateReservationBody {
  type: ReservationType;
  name: string;
  confirmationNumber?: string | null;
  startDateTime?: string | null;
  endDateTime?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  costCents?: number | null;
  notes?: string | null;
}

/**
 * PATCH /api/trips/:tripId/reservations/:reservationId
 * Omitted fields remain unchanged.
 * Sending null clears a nullable field.
 */
export type UpdateReservationBody = Partial<CreateReservationBody>;

// -------------------- Itinerary --------------------

/** One standalone itinerary event returned by the itinerary endpoint. */
export interface ItineraryEvent {
  id: string;
  createdById: string;
  title: string;
  startDateTime: string;
  endDateTime: string | null;
  locationName: string | null;
  activityId: string | null;
  reservationId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One calendar day in the trip itinerary. */
export interface ItineraryDay {
  date: string;
  events: ItineraryEvent[];
}

/** GET /api/trips/:tripId/itinerary */
export interface ItineraryResponse {
  startDate: string;
  endDate: string;
  events: ItineraryEvent[];
}

export interface ItineraryEventDetail {
  id: string;
  createdById: string;
  title: string;
  description: string | null;
  startDateTime: string;
  endDateTime: string | null;
  locationName: string | null;
  locationAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  activityId: string | null;
  reservationId: string | null;
  activity: {
    id: string;
    name: string;
  } | null;
  reservation: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryEventDetailResponse {
  itineraryEvent: ItineraryEventDetail;
}

export interface CreateItineraryEventBody {
  title: string;
  description?: string | null;
  startDateTime: string;
  endDateTime?: string | null;
  timeZone: string;
  locationName?: string | null;
  locationAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  activityId?: string | null;
  reservationId?: string | null;
}

export type UpdateItineraryEventBody =
  Omit<Partial<CreateItineraryEventBody>, 'timeZone'> & {
    timeZone: string;
  };

// -------------------- Invitations --------------------

/**
 * Mirrors the InvitationStatus enum on the server.
 *
 * EXPIRED is computed, not stored - the server reconciles a stored PENDING
 * against the clock before it answers. Never recompute it on the client;
 * two places doing that arithmetic is how a list starts disagreeing with the
 * buttons on it.
 */
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

/**
 * What a trip OWNER sees. Carries the token, because the owner is the person
 * who copies the link - which is also why this only ever comes back from an
 * owner-gated route.
 */
export interface TripInvitation {
  id: string;
  email: string;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  invitedBy: UserSummary;
}

/** The trip summary an invitee can see before they have joined anything. */
export interface InvitedTripSummary {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
}

/**
 * What an INVITEE sees. No `email` - they know their own - but it carries the
 * trip, since the invitee has no other way to find out what they are being
 * invited to.
 */
export interface MyInvitation {
  id: string;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  invitedBy: UserSummary;
  trip: InvitedTripSummary;
}

/** GET /api/trips/:tripId/invitations */
export interface TripInvitationListResponse {
  invitations: TripInvitation[];
}

/** POST /api/trips/:tripId/invitations */
export interface TripInvitationResponse {
  invitation: TripInvitation;
}

/** POST /api/trips/:tripId/invitations */
export interface CreateInvitationBody {
  email: string;
}

/** GET /api/invitations */
export interface MyInvitationListResponse {
  invitations: MyInvitation[];
}

/** GET /api/invitations/:token */
export interface InvitationPreviewResponse {
  invitation: MyInvitation;
}

/** POST /api/invitations/:token/accept - the id is where to navigate next. */
export interface AcceptInvitationResponse {
  tripId: string;
}
