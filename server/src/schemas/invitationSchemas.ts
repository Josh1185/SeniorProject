/**
 * FILE: invitationSchemas.ts
 * DESCRIPTION: Zod validation schemas for the invitation module.
 *
 * LAST UPDATED: 2026-11-05 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { z } from 'zod';

// -------------------- Create Schema --------------------

/**
 * POST /api/trips/:tripId/invitations
 *
 * THE LOWERCASING IS NOT COSMETIC. The email is what decides whose Trip
 * Invites tab an invitation appears in, and that lookup is an equality match.
 * An owner typing "Josh@Example.com" for a user registered as
 * "josh@example.com" would create an invitation that is visible to nobody -
 * no error, no bounce, just an invite that silently never arrives.
 *
 * Normalising on the way IN means every stored email is comparable, and the
 * controller lowercases the caller's own address before matching. Both sides
 * of the comparison, or it only half works.
 *
 * Order matters: trim and lowercase run BEFORE the format check, so a pasted
 * " Josh@Example.com " is cleaned and then validated rather than rejected for
 * whitespace a user cannot see.
 */
export const createInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    // Bounded before the format check so an enormous string is rejected
    // cheaply. 254 is the maximum length of an email address per RFC 5321.
    .max(254, 'Email address is too long')
    .pipe(z.email('Enter a valid email address')),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
