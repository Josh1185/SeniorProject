/**
 * FILE: settlement.ts
 * DESCRIPTION: Who owes who, and the payments that clear it.
 *
 *              THE WHOLE EXPENSE MODULE EXISTS TO PRODUCE THIS SCREEN.
 *              Everything else - splitting, participants, the re-split on
 *              edit - is bookkeeping in service of two questions: what is my
 *              balance, and who do I pay.
 *
 *              BALANCES ARE DERIVED, NEVER STORED. There is no balance column
 *              and no Settlement table. A stored balance is a cache of a sum,
 *              and a cache of a sum goes stale the first time an expense is
 *              edited by code that forgot to update it. Recomputing from the
 *              expenses is cheap at this scale and cannot drift.
 *
 *              Both functions are pure and both are unit tested, because the
 *              property they hold up - the group's balances net to exactly
 *              zero - is the one thing in the application that is provably
 *              right or provably broken, with nothing in between.
 *
 * LAST UPDATED: 2026-11-17 - File Created (Josh Iehle)
 */

// -------------------- Types --------------------

export interface MemberBalance {
  userId: string;
  /** Total this person paid out for the group, in cents. */
  paidCents: number;
  /** Total of this person's shares across every expense, in cents. */
  owedCents: number;
  /**
   * paidCents - owedCents.
   *
   * POSITIVE means the group owes them. NEGATIVE means they owe the group.
   * Zero means settled up.
   */
  balanceCents: number;
}

export interface Settlement {
  fromUserId: string;
  toUserId: string;
  /** Always positive. A zero-value payment is not a payment. */
  amountCents: number;
}

// -------------------- Balances --------------------

/**
 * Every person's position on the trip.
 *
 * `userIds` is the UNION of current members and everyone who appears in the
 * trip's expenses - not just the current roster. Someone who paid for dinner
 * and was later removed from the trip still has their money in the pot, and
 * leaving them out would make the balances not net to zero while looking
 * perfectly reasonable on screen.
 *
 * Sorted by balance descending: whoever is owed the most at the top, whoever
 * owes the most at the bottom, which reads as a ledger. Ties break on id so
 * the order is stable between requests rather than shuffling on refresh.
 */
export function computeBalances(
  userIds: readonly string[],
  paidCentsByUser: Readonly<Record<string, number>>,
  owedCentsByUser: Readonly<Record<string, number>>,
): MemberBalance[] {
  return userIds
    .map((userId) => {
      const paidCents = paidCentsByUser[userId] ?? 0;
      const owedCents = owedCentsByUser[userId] ?? 0;

      return { userId, paidCents, owedCents, balanceCents: paidCents - owedCents };
    })
    .sort((a, b) => b.balanceCents - a.balanceCents || a.userId.localeCompare(b.userId));
}

/**
 * Whether a set of balances is internally consistent.
 *
 * Every cent someone paid is a cent someone owes, so the balances must sum to
 * exactly zero. They can only fail to if an expense's shares do not sum to its
 * amount - which splitEqually and the re-split in updateExpense exist to
 * prevent, and which nothing in the database can enforce.
 *
 * Exported so the controller can assert it before answering, rather than
 * serving numbers it has not checked.
 */
export function balancesNetToZero(balances: readonly MemberBalance[]): boolean {
  return balances.reduce((total, balance) => total + balance.balanceCents, 0) === 0;
}

// -------------------- Settlement --------------------

/**
 * The payments that clear every balance.
 *
 * THE ALGORITHM: repeatedly match the largest debtor against the largest
 * creditor, transfer whichever of the two is smaller, and drop anyone who
 * reaches zero. Each pass settles at least one person completely, so a group
 * of n people with non-zero balances needs at most n-1 payments - which is the
 * difference between "Brandon pays Josh $41.33" and a tangle where everyone
 * owes everyone.
 *
 * HONESTY ABOUT "SMALLEST": finding the provably minimum number of payments is
 * the subset-sum problem and is NP-hard. This is the standard greedy. It is
 * bounded by n-1, it is optimal whenever no subgroup happens to cancel out
 * among itself, and for a group of friends on a trip the difference never
 * shows up. Say that rather than claiming a minimum this does not compute.
 *
 * Works entirely in integer cents, so the payments always clear the balances
 * exactly - there is no rounding step to lose a cent in.
 */
export function settleBalances(balances: readonly MemberBalance[]): Settlement[] {
  // Copies with their own running totals: this function must not mutate the
  // balances it was handed, which the caller is also rendering.
  const debtors = balances
    .filter((balance) => balance.balanceCents < 0)
    .map((balance) => ({ userId: balance.userId, remaining: -balance.balanceCents }))
    .sort((a, b) => b.remaining - a.remaining || a.userId.localeCompare(b.userId));

  const creditors = balances
    .filter((balance) => balance.balanceCents > 0)
    .map((balance) => ({ userId: balance.userId, remaining: balance.balanceCents }))
    .sort((a, b) => b.remaining - a.remaining || a.userId.localeCompare(b.userId));

  const settlements: Settlement[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    // Defensive, and unreachable while the loop condition holds - but an
    // index read is `T | undefined` under noUncheckedIndexedAccess.
    if (!debtor || !creditor) break;

    const amountCents = Math.min(debtor.remaining, creditor.remaining);

    if (amountCents > 0) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amountCents,
      });
    }

    debtor.remaining -= amountCents;
    creditor.remaining -= amountCents;

    // At least one of these fires every pass, which is what makes the loop
    // terminate and what bounds the result at n-1 payments.
    if (debtor.remaining === 0) debtorIndex += 1;
    if (creditor.remaining === 0) creditorIndex += 1;
  }

  return settlements;
}
