/**
 * FILE: inviteToken.ts
 * DESCRIPTION: Generating the secret in an invitation link.
 *
 *              THIS TOKEN IS THE ENTIRE AUTHORIZATION. Anyone holding it can
 *              join the trip - there is no email check on accept, by design
 *              (see invitationController). That makes it a bearer credential,
 *              not an identifier, and the two have different requirements.
 *
 *              NOT uuid(7), which is what every id in this schema uses. v7 is
 *              time-ordered: its first 48 bits are a millisecond timestamp, so
 *              roughly half of a v7 is not secret at all. Knowing when an
 *              invite was sent would narrow the search enormously. Fine for a
 *              primary key, wrong for a credential.
 *
 *              NOT uuid(4) either. 122 random bits is defensible, but it costs
 *              nothing to double it and the intent reads more clearly when the
 *              token is obviously not an id.
 *
 * LAST UPDATED: 2026-11-05 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { randomBytes } from 'node:crypto';

// -------------------- Constants --------------------

/** 32 bytes = 256 bits of entropy, which base64url renders as 43 characters. */
const TOKEN_BYTES = 32;

/**
 * The longest token we will look up in the database.
 *
 * Ours are always 43 characters. The cap exists so a caller cannot make the
 * server run an indexed lookup on a megabyte of garbage.
 */
export const MAX_TOKEN_LENGTH = 100;

// -------------------- Generation --------------------

/**
 * A fresh invitation token.
 *
 * base64url rather than base64 or hex: it produces no `+`, `/` or `=`, so the
 * token drops straight into a URL with nothing to percent-encode and nothing
 * for a chat client to mangle when it linkifies the message.
 */
export function newInviteToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

/**
 * Whether a string is shaped like one of our tokens.
 *
 * Not a security check - the database lookup is what decides whether a token
 * is real. This only rejects input that could not possibly match, before it
 * reaches Prisma.
 */
export function isPlausibleToken(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_TOKEN_LENGTH;
}
