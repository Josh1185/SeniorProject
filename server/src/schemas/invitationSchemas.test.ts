/**
 * FILE: invitationSchemas.test.ts
 * DESCRIPTION: Unit tests for the invitation module's Zod schemas.
 *
 *              The normalisation cases are the ones that matter. An email
 *              that validates but is not normalised produces an invitation
 *              that is addressed to nobody - no error anywhere, it simply
 *              never appears in the invitee's tab.
 *
 * LAST UPDATED: 2026-11-05 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { describe, expect, it } from 'vitest';
import { createInvitationSchema } from './invitationSchemas';

// -------------------- Helpers --------------------

/** The parsed email, or undefined when the input was rejected. */
function parseEmail(email: unknown): string | undefined {
  const result = createInvitationSchema.safeParse({ email });
  return result.success ? result.data.email : undefined;
}

// -------------------- Create Schema --------------------

describe('createInvitationSchema', () => {
  it('accepts an ordinary address', () => {
    expect(parseEmail('josh@example.com')).toBe('josh@example.com');
  });

  // ----- Normalisation. The whole reason this schema exists. -----

  it('lowercases the address', () => {
    // "Josh@Example.com" stored as typed would never match a user registered
    // as "josh@example.com", and the invitation would be visible to nobody.
    expect(parseEmail('Josh@Example.com')).toBe('josh@example.com');
  });

  it('trims surrounding whitespace', () => {
    // Pasted addresses carry spaces far more often than typed ones do.
    expect(parseEmail('  josh@example.com  ')).toBe('josh@example.com');
  });

  it('trims and lowercases together, in that order', () => {
    // Trim runs BEFORE the format check, so this is cleaned rather than
    // rejected for whitespace the user cannot see.
    expect(parseEmail('\t Josh@Example.COM \n')).toBe('josh@example.com');
  });

  it('keeps a plus-address intact', () => {
    // Tagged addresses are how everyone makes disposable test accounts, and
    // the local part is case-sensitive in principle - but lowercasing it is
    // the right trade, since every mainstream provider treats it that way.
    expect(parseEmail('josh+trip@example.com')).toBe('josh+trip@example.com');
  });

  it('accepts a subdomain and a long TLD', () => {
    expect(parseEmail('a@mail.example.technology')).toBe('a@mail.example.technology');
  });

  // ----- Rejections -----

  it('rejects an address with no @', () => {
    expect(parseEmail('joshexample.com')).toBeUndefined();
  });

  it('rejects an address with no domain', () => {
    expect(parseEmail('josh@')).toBeUndefined();
  });

  it('rejects an address with no local part', () => {
    expect(parseEmail('@example.com')).toBeUndefined();
  });

  it('rejects an empty string', () => {
    expect(parseEmail('')).toBeUndefined();
  });

  it('rejects whitespace only', () => {
    // Trimmed to '' before the format check.
    expect(parseEmail('   ')).toBeUndefined();
  });

  it('rejects an address with an internal space', () => {
    expect(parseEmail('josh smith@example.com')).toBeUndefined();
  });

  it('rejects a non-string', () => {
    expect(parseEmail(42)).toBeUndefined();
    expect(parseEmail(null)).toBeUndefined();
    expect(parseEmail(['a@b.com'])).toBeUndefined();
  });

  it('rejects an address longer than RFC 5321 allows', () => {
    // Bounded before the format check so an enormous string is rejected
    // cheaply rather than run through a regex.
    expect(parseEmail(`${'x'.repeat(250)}@example.com`)).toBeUndefined();
  });

  it('rejects a missing email entirely', () => {
    expect(createInvitationSchema.safeParse({}).success).toBe(false);
  });

  it('ignores unknown keys rather than rejecting them', () => {
    // Zod objects strip unknown keys. A client sending `role: "OWNER"` must
    // not be able to invite someone as an owner - and it cannot, because the
    // field never reaches the controller.
    const result = createInvitationSchema.safeParse({
      email: 'josh@example.com',
      role: 'OWNER',
    });

    expect(result.success).toBe(true);
    expect(result.success && 'role' in result.data).toBe(false);
  });
});
