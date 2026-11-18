/**
 * FILE: settlement.test.ts
 * DESCRIPTION: Unit tests for balances and settlement.
 *
 *              The worked examples below are worth reading, but the property
 *              test at the bottom is the one that matters. It builds random
 *              trips out of the REAL splitEqually, computes balances, settles
 *              them, and asserts four things that must hold for every possible
 *              trip - which is a much stronger claim than any list of examples.
 *
 * LAST UPDATED: 2026-11-17 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { describe, expect, it } from 'vitest';
import { splitEqually } from './money';
import {
  balancesNetToZero,
  computeBalances,
  settleBalances,
  type MemberBalance,
} from './settlement';

// -------------------- Helpers --------------------

/** A balance row, for the settlement tests that do not care how it arose. */
function balance(userId: string, balanceCents: number): MemberBalance {
  return {
    userId,
    // paid/owed are not what settleBalances reads; only the difference is.
    paidCents: balanceCents > 0 ? balanceCents : 0,
    owedCents: balanceCents < 0 ? -balanceCents : 0,
    balanceCents,
  };
}

/** Applies settlements to balances and returns what is left. */
function applySettlements(balances: MemberBalance[], settlements: ReturnType<typeof settleBalances>) {
  const after = new Map(balances.map((b) => [b.userId, b.balanceCents]));

  for (const settlement of settlements) {
    after.set(settlement.fromUserId, (after.get(settlement.fromUserId) ?? 0) + settlement.amountCents);
    after.set(settlement.toUserId, (after.get(settlement.toUserId) ?? 0) - settlement.amountCents);
  }

  return [...after.values()];
}

/** Deterministic PRNG, so a failure is reproducible rather than a one-off. */
function makeRng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// -------------------- computeBalances --------------------

describe('computeBalances', () => {
  it('computes the worked example from the spec', () => {
    // $62.00 of gas, Josh paid, split three ways: 2067 / 2067 / 2066.
    const users = ['josh', 'brandon', 'chris'];
    const owed: Record<string, number> = {};
    for (const share of splitEqually(6200, users)) owed[share.userId] = share.shareCents;

    const balances = computeBalances(users, { josh: 6200 }, owed);

    expect(balances).toEqual([
      { userId: 'josh', paidCents: 6200, owedCents: 2067, balanceCents: 4133 },
      { userId: 'chris', paidCents: 0, owedCents: 2066, balanceCents: -2066 },
      { userId: 'brandon', paidCents: 0, owedCents: 2067, balanceCents: -2067 },
    ]);
  });

  it('breaks ties on user id so the order is stable between requests', () => {
    // Without a tiebreak, two people on zero could swap places on every
    // refresh for no reason the user can see.
    const balances = computeBalances(['zed', 'amy'], {}, {});
    expect(balances.map((entry) => entry.userId)).toEqual(['amy', 'zed']);
  });

  it('gives someone with no activity a zero balance rather than omitting them', () => {
    const balances = computeBalances(['a', 'b'], { a: 1000 }, { a: 1000 });
    expect(balances.find((entry) => entry.userId === 'b')).toEqual({
      userId: 'b',
      paidCents: 0,
      owedCents: 0,
      balanceCents: 0,
    });
  });

  it('includes someone who paid but is no longer on the trip', () => {
    // A removed member's expenses stay behind. Leaving them out of the
    // balances would look reasonable on screen and not net to zero.
    const balances = computeBalances(['alice', 'bob'], { alice: 3000 }, { alice: 1500, bob: 1500 });

    expect(balancesNetToZero(balances)).toBe(true);
    expect(balances.find((entry) => entry.userId === 'alice')?.balanceCents).toBe(1500);
  });
});

// -------------------- balancesNetToZero --------------------

describe('balancesNetToZero', () => {
  it('is true for a consistent set', () => {
    expect(balancesNetToZero([balance('a', 4133), balance('b', -2067), balance('c', -2066)])).toBe(
      true,
    );
  });

  it('is true for an empty trip', () => {
    expect(balancesNetToZero([])).toBe(true);
  });

  it('catches a single invented cent', () => {
    // This is what a rounded split rather than a distributed remainder looks
    // like by the time it reaches a balance sheet.
    expect(balancesNetToZero([balance('a', 4134), balance('b', -2067), balance('c', -2066)])).toBe(
      false,
    );
  });
});

// -------------------- settleBalances --------------------

describe('settleBalances', () => {
  it('settles the worked example in two payments', () => {
    const settlements = settleBalances([
      balance('josh', 4133),
      balance('chris', -2066),
      balance('brandon', -2067),
    ]);

    expect(settlements).toEqual([
      { fromUserId: 'brandon', toUserId: 'josh', amountCents: 2067 },
      { fromUserId: 'chris', toUserId: 'josh', amountCents: 2066 },
    ]);
  });

  it('returns nothing when everyone is settled up', () => {
    expect(settleBalances([balance('a', 0), balance('b', 0)])).toEqual([]);
  });

  it('returns nothing for an empty trip', () => {
    expect(settleBalances([])).toEqual([]);
  });

  it('splits one debtor across two creditors', () => {
    const settlements = settleBalances([
      balance('a', 3000),
      balance('b', 1000),
      balance('c', -4000),
    ]);

    expect(settlements).toEqual([
      { fromUserId: 'c', toUserId: 'a', amountCents: 3000 },
      { fromUserId: 'c', toUserId: 'b', amountCents: 1000 },
    ]);
  });

  it('never creates a payment to yourself', () => {
    const balances = [balance('a', 500), balance('b', -500)];
    for (const settlement of settleBalances(balances)) {
      expect(settlement.fromUserId).not.toBe(settlement.toUserId);
    }
  });

  it('does not mutate the balances it was given', () => {
    // The caller is rendering this same array.
    const balances = [balance('a', 4133), balance('b', -2067), balance('c', -2066)];
    const before = JSON.stringify(balances);

    settleBalances(balances);

    expect(JSON.stringify(balances)).toBe(before);
  });
});

// -------------------- The property that matters --------------------

describe('balances and settlement, over random trips', () => {
  it('holds four properties for ten thousand generated trips', () => {
    const rng = makeRng(123456789);

    for (let trip = 0; trip < 10_000; trip += 1) {
      // ----- Build a trip out of the REAL split -----
      const memberCount = 2 + Math.floor(rng() * 7);
      const users = Array.from({ length: memberCount }, (_, index) => `u${index}`);

      const paid: Record<string, number> = {};
      const owed: Record<string, number> = {};

      const expenseCount = Math.floor(rng() * 15);

      for (let expense = 0; expense < expenseCount; expense += 1) {
        const amountCents = 1 + Math.floor(rng() * 500_000);
        const payer = users[Math.floor(rng() * memberCount)] as string;

        const participants = [...users]
          .sort(() => rng() - 0.5)
          .slice(0, 1 + Math.floor(rng() * memberCount));

        paid[payer] = (paid[payer] ?? 0) + amountCents;

        for (const share of splitEqually(amountCents, participants)) {
          owed[share.userId] = (owed[share.userId] ?? 0) + share.shareCents;
        }
      }

      const balances = computeBalances(users, paid, owed);
      const settlements = settleBalances(balances);

      // ----- 1. The balances net to exactly zero -----
      // Every cent someone paid is a cent someone owes. This is the headline
      // invariant of the whole expense module.
      expect(balancesNetToZero(balances)).toBe(true);

      // ----- 2. The settlements clear every balance exactly -----
      // Not approximately. Integer cents all the way through means there is
      // no rounding step for a cent to disappear into.
      for (const remaining of applySettlements(balances, settlements)) {
        expect(remaining).toBe(0);
      }

      // ----- 3. At most n-1 payments -----
      // Each pass settles somebody completely, so this is the bound that
      // makes the result readable rather than a tangle.
      const involved = balances.filter((entry) => entry.balanceCents !== 0).length;
      if (involved > 0) {
        expect(settlements.length).toBeLessThanOrEqual(involved - 1);
      }

      // ----- 4. Every payment is a real payment -----
      for (const settlement of settlements) {
        expect(Number.isInteger(settlement.amountCents)).toBe(true);
        expect(settlement.amountCents).toBeGreaterThan(0);
        expect(settlement.fromUserId).not.toBe(settlement.toUserId);
      }
    }
  });
});
