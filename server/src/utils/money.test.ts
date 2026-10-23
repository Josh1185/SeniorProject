/**
 * FILE: money.test.ts
 * DESCRIPTION: Unit tests for the split arithmetic.
 *
 *              This is the test the Expense model's schema comment asks for.
 *              The invariant it protects - shares sum to exactly the total -
 *              cannot be expressed as a database constraint, so it only holds
 *              because this file keeps holding it.
 *
 * LAST UPDATED: 2026-10-20 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { describe, expect, it } from 'vitest';
import { splitEqually, sumShares } from './money';

// -------------------- splitEqually --------------------

describe('splitEqually', () => {
  it('distributes a remainder one cent at a time', () => {
    // The canonical case: $62.00 of gas between three people.
    // 6200 / 3 = 2066.67, so two people pay a cent more.
    const shares = splitEqually(6200, ['a', 'b', 'c']);
    expect(shares.map((s) => s.shareCents)).toEqual([2067, 2067, 2066]);
    expect(sumShares(shares)).toBe(6200);
  });

  it('gives everyone the same share when it divides evenly', () => {
    const shares = splitEqually(6000, ['a', 'b', 'c']);
    expect(shares.map((s) => s.shareCents)).toEqual([2000, 2000, 2000]);
  });

  it('gives a single participant the whole amount', () => {
    expect(splitEqually(1299, ['a'])).toEqual([{ userId: 'a', shareCents: 1299 }]);
  });

  it('handles an amount smaller than the participant count', () => {
    // Three cents cannot be split four ways without someone paying nothing.
    // That is correct, not a bug - and the total is still exact.
    const shares = splitEqually(3, ['a', 'b', 'c', 'd']);
    expect(shares.map((s) => s.shareCents)).toEqual([1, 1, 1, 0]);
    expect(sumShares(shares)).toBe(3);
  });

  it('handles a zero amount', () => {
    const shares = splitEqually(0, ['a', 'b']);
    expect(shares.map((s) => s.shareCents)).toEqual([0, 0]);
  });

  it('preserves the participant order it was given', () => {
    const shares = splitEqually(100, ['c', 'a', 'b']);
    expect(shares.map((s) => s.userId)).toEqual(['c', 'a', 'b']);
  });

  it('never gives anyone a negative or fractional share', () => {
    const shares = splitEqually(1, ['a', 'b', 'c']);
    for (const share of shares) {
      expect(Number.isInteger(share.shareCents)).toBe(true);
      expect(share.shareCents).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps shares within one cent of each other', () => {
    // Nobody should pay meaningfully more than anyone else in an equal split.
    const shares = splitEqually(100000, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    const values = shares.map((s) => s.shareCents);
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
  });

  // ----- The property that actually matters -----
  it('always sums to exactly the amount, across a wide range of inputs', () => {
    // The individual cases above are examples. This is the invariant itself:
    // for ANY amount and ANY participant count, no cent is created or lost.
    // If a future change to splitEqually starts rounding, this fails long
    // before a settlement screen refuses to balance.
    for (let participants = 1; participants <= 12; participants += 1) {
      const userIds = Array.from({ length: participants }, (_, i) => `user-${i}`);

      for (let amount = 0; amount <= 400; amount += 1) {
        expect(sumShares(splitEqually(amount, userIds))).toBe(amount);
      }

      for (const amount of [999, 1000, 1001, 123456, 999999, 2_147_483_647]) {
        expect(sumShares(splitEqually(amount, userIds))).toBe(amount);
      }
    }
  });

  it('rejects a non-integer amount', () => {
    // 62.50 means someone passed dollars where cents were expected. Catching
    // it here turns a silent hundred-fold error into a loud one.
    expect(() => splitEqually(62.5, ['a'])).toThrow(/integer cents/);
  });

  it('rejects a negative amount', () => {
    expect(() => splitEqually(-100, ['a'])).toThrow(/non-negative/);
  });

  it('rejects an empty participant list', () => {
    // Dividing by zero would give Infinity and write nonsense to the database.
    expect(() => splitEqually(1000, [])).toThrow(/at least one participant/);
  });
});

// -------------------- sumShares --------------------

describe('sumShares', () => {
  it('totals the shares', () => {
    expect(
      sumShares([
        { userId: 'a', shareCents: 2067 },
        { userId: 'b', shareCents: 2066 },
      ]),
    ).toBe(4133);
  });

  it('returns zero for no shares', () => {
    expect(sumShares([])).toBe(0);
  });
});
