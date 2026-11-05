/**
 * FILE: invitation.test.ts
 * DESCRIPTION: Unit tests for invitation lifetime and status reconciliation.
 *
 *              Both functions take `now` as a parameter, which is the only
 *              reason they are testable at all. A function that reads the
 *              clock itself can only be tested by waiting.
 *
 * LAST UPDATED: 2026-11-05 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { describe, expect, it } from 'vitest';
import { effectiveStatus, invitationExpiresAt, INVITE_TTL_DAYS, isActionable } from './invitation';

// -------------------- Fixtures --------------------

const NOW = new Date('2026-11-05T18:00:00.000Z');

/** A point `days` from NOW. Negative is in the past. */
function fromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

// -------------------- invitationExpiresAt --------------------

describe('invitationExpiresAt', () => {
  it('is the configured number of days ahead', () => {
    expect(invitationExpiresAt(NOW).toISOString()).toBe(fromNow(INVITE_TTL_DAYS).toISOString());
  });

  it('is always in the future relative to its own starting point', () => {
    expect(invitationExpiresAt(NOW).getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('does not mutate the date it was given', () => {
    const start = new Date(NOW);
    invitationExpiresAt(start);
    expect(start.toISOString()).toBe(NOW.toISOString());
  });
});

// -------------------- effectiveStatus --------------------

describe('effectiveStatus', () => {
  it('leaves a live pending invitation pending', () => {
    expect(effectiveStatus('PENDING', fromNow(7), NOW)).toBe('PENDING');
  });

  it('reports a lapsed pending invitation as expired', () => {
    // The stored column still reads PENDING - nothing sweeps the table - so
    // this reconciliation is the only thing standing between the owner's list
    // and a row that looks usable and is not.
    expect(effectiveStatus('PENDING', fromNow(-1), NOW)).toBe('EXPIRED');
  });

  it('treats the exact expiry instant as expired', () => {
    // Boundaries on a credential round towards the safe side: dead ON the
    // millisecond, not one tick after it.
    expect(effectiveStatus('PENDING', NOW, NOW)).toBe('EXPIRED');
  });

  it('treats one millisecond before expiry as still pending', () => {
    expect(effectiveStatus('PENDING', new Date(NOW.getTime() + 1), NOW)).toBe('PENDING');
  });

  it('never resurrects a resolved invitation', () => {
    // An ACCEPTED invitation whose window has passed is still ACCEPTED. The
    // membership it created does not evaporate, so reporting EXPIRED here
    // would be a lie that reads as "you were removed from the trip".
    expect(effectiveStatus('ACCEPTED', fromNow(-30), NOW)).toBe('ACCEPTED');
    expect(effectiveStatus('DECLINED', fromNow(-30), NOW)).toBe('DECLINED');
    expect(effectiveStatus('EXPIRED', fromNow(-30), NOW)).toBe('EXPIRED');
  });

  it('leaves a resolved invitation alone even inside its window', () => {
    expect(effectiveStatus('ACCEPTED', fromNow(7), NOW)).toBe('ACCEPTED');
    expect(effectiveStatus('DECLINED', fromNow(7), NOW)).toBe('DECLINED');
  });
});

// -------------------- isActionable --------------------

describe('isActionable', () => {
  it('is true only for a live pending invitation', () => {
    expect(isActionable('PENDING', fromNow(7), NOW)).toBe(true);
  });

  it('is false once the window has passed', () => {
    expect(isActionable('PENDING', fromNow(-1), NOW)).toBe(false);
  });

  it('is false for anything already resolved', () => {
    expect(isActionable('ACCEPTED', fromNow(7), NOW)).toBe(false);
    expect(isActionable('DECLINED', fromNow(7), NOW)).toBe(false);
    expect(isActionable('EXPIRED', fromNow(7), NOW)).toBe(false);
  });

  it('agrees with effectiveStatus across every combination', () => {
    // The two must never disagree: accept and decline gate on isActionable,
    // while the owner's list renders effectiveStatus. If one said PENDING and
    // the other did not, the list would offer a revoke that the write path
    // refuses - or worse, the reverse.
    const statuses = ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'] as const;
    const windows = [fromNow(-30), fromNow(-1), NOW, fromNow(1), fromNow(30)];

    for (const status of statuses) {
      for (const expiresAt of windows) {
        expect(isActionable(status, expiresAt, NOW)).toBe(
          effectiveStatus(status, expiresAt, NOW) === 'PENDING',
        );
      }
    }
  });
});
