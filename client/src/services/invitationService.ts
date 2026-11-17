/**
 * FILE: invitationService.ts
 * DESCRIPTION: Every network call the invitation module makes. No React in
 *              here at all.
 *
 *              THE FUNCTIONS SPLIT INTO TWO GROUPS, the same way the server's
 *              controller does, and for the same reason. The owner-facing ones
 *              hang off /trips/:tripId and only work for someone who owns that
 *              trip. The caller-facing ones hang off /invitations and work for
 *              someone with no access to the trip at all - which is the whole
 *              point of an invitation.
 *
 * LAST UPDATED: 2026-11-16 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type {
  AcceptInvitationResponse,
  CreateInvitationBody,
  InvitationPreviewResponse,
  MyInvitationListResponse,
  TripInvitationResponse,
  TripInvitationListResponse,
} from '../types/api';

// -------------------- Module and lib imports --------------------
import { del, get, post } from '../lib/api';

// =============================================================================
// OWNER - requires ownership of the trip
// =============================================================================

/** GET /api/trips/:tripId/invitations */
export function fetchTripInvitations(tripId: string): Promise<TripInvitationListResponse> {
  return get<TripInvitationListResponse>(`/trips/${tripId}/invitations`);
}

/** POST /api/trips/:tripId/invitations */
export function createInvitation(
  tripId: string,
  body: CreateInvitationBody,
): Promise<TripInvitationResponse> {
  return post<TripInvitationResponse>(`/trips/${tripId}/invitations`, body);
}

/** DELETE /api/trips/:tripId/invitations/:invitationId - 204, nothing to type. */
export function revokeInvitation(tripId: string, invitationId: string): Promise<void> {
  return del(`/trips/${tripId}/invitations/${invitationId}`);
}

// =============================================================================
// CALLER - requires only a signed-in user
// =============================================================================

/** GET /api/invitations - whatever is addressed to the caller's own email. */
export function fetchMyInvitations(): Promise<MyInvitationListResponse> {
  return get<MyInvitationListResponse>('/invitations');
}

/**
 * GET /api/invitations/:token - what this link is an invitation to.
 *
 * Read-only, and the only one of these that does not change anything. It is
 * what lets the landing page name the trip before asking someone to join it.
 */
export function fetchInvitationByToken(token: string): Promise<InvitationPreviewResponse> {
  return get<InvitationPreviewResponse>(`/invitations/${token}`);
}

/**
 * POST /api/invitations/:token/accept
 *
 * Returns the trip id, because the point of accepting is to land in the trip.
 */
export function acceptInvitation(token: string): Promise<AcceptInvitationResponse> {
  return post<AcceptInvitationResponse>(`/invitations/${token}/accept`, {});
}

/** POST /api/invitations/:token/decline - 204, nothing to type. */
export function declineInvitation(token: string): Promise<void> {
  return post<void>(`/invitations/${token}/decline`, {});
}
