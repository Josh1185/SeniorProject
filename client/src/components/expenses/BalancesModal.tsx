/**
 * FILE: BalancesModal.tsx
 * DESCRIPTION: Who owes who, for the whole trip.
 *
 *              THIS IS THE SCREEN THE EXPENSE MODULE EXISTS FOR. Everything
 *              else - splitting, participants, the re-split on edit - is
 *              bookkeeping in service of the two lists below.
 *
 *              NOT in the expense detail modal, which shows one expense and
 *              already answers its own question. Balances are trip-wide: they
 *              are the sum of every expense, and no single one of them can
 *              show you what you owe overall.
 *
 *              THE NUMBERS ARE COMPUTED SERVER-SIDE and rendered here
 *              untouched. No arithmetic in this file at all - not even a sum
 *              for a total. A second implementation of the balance maths on
 *              the client is how a screen starts disagreeing with itself.
 *
 * LAST UPDATED: 2026-11-17 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { MemberBalance, Settlement } from '../../types/api';

// -------------------- Module and lib imports --------------------
import { formatCents } from '../../lib/format';

// -------------------- Hook imports --------------------
import { useAuth } from '../../lib/auth/useAuth';
import { useBalances } from '../../hooks/expenses/useBalances';

// -------------------- Component imports --------------------
import { Modal } from '../Modal';

// -------------------- Props interface --------------------
interface BalancesModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string | undefined;
}

// -------------------- Internal Components --------------------

/**
 * One person's position.
 *
 * Reads as a sentence rather than a signed number. "+$41.33" makes a reader
 * work out what the sign means on a screen where both directions are normal;
 * "is owed $41.33" does not.
 */
function BalanceRow({ entry, isYou }: { entry: MemberBalance; isYou: boolean }) {
  const settled = entry.balanceCents === 0;
  const isCreditor = entry.balanceCents > 0;

  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
        isYou ? 'border-brand-600 bg-ink-100' : 'border-ink-300'
      }`}
    >
      <span className="min-w-0">
        <span className="truncate text-sm text-ink-900">
          {entry.user.displayName}
          {isYou && <span className="ml-2 text-xs font-medium text-brand-600">You</span>}
        </span>

        {/* A former member still has money in the pot - their expenses did
            not leave with them - so they appear here and are labelled rather
            than silently dropped, which would stop the balances netting out. */}
        {!entry.isMember && (
          <span className="ml-2 text-xs text-ink-700">(no longer on this trip)</span>
        )}

        <span className="mt-0.5 block text-xs text-ink-700 tabular-nums">
          paid {formatCents(entry.paidCents)} · owes {formatCents(entry.owedCents)}
        </span>
      </span>

      <span className="shrink-0 text-right">
        {settled ? (
          <span className="text-sm text-ink-700">Settled up</span>
        ) : (
          <>
            <span className="block text-xs text-ink-700">{isCreditor ? 'is owed' : 'owes'}</span>
            <span
              className={`block text-sm font-semibold tabular-nums ${
                isCreditor ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {/* Math.abs on the DISPLAY only. The sign is what the words
                  above already said. */}
              {formatCents(Math.abs(entry.balanceCents))}
            </span>
          </>
        )}
      </span>
    </li>
  );
}

/** One payment in the settlement plan. */
function SettlementRow({ settlement, youId }: { settlement: Settlement; youId: string | undefined }) {
  const youPay = settlement.from.id === youId;
  const youReceive = settlement.to.id === youId;

  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
        youPay || youReceive ? 'border-brand-600 bg-ink-100' : 'border-ink-300'
      }`}
    >
      <span className="min-w-0 truncate text-sm text-ink-900">
        <span className="font-medium">{youPay ? 'You' : settlement.from.displayName}</span>
        {' pay'}
        {youPay ? '' : 's'}{' '}
        <span className="font-medium">{youReceive ? 'you' : settlement.to.displayName}</span>
      </span>

      <span className="shrink-0 text-sm font-semibold text-ink-900 tabular-nums">
        {formatCents(settlement.amountCents)}
      </span>
    </li>
  );
}

// -------------------- Component --------------------
export function BalancesModal({ open, onClose, tripId }: BalancesModalProps) {
  const { session } = useAuth();
  // No `open` gate: ExpensesPage calls this same hook for its summary line,
  // so by the time anyone clicks through, the numbers are already cached.
  const balances = useBalances(tripId);

  const youId = session?.user?.id;
  const data = balances.data;

  return (
    <Modal open={open} onClose={onClose} title="Balances">
      {balances.isLoading && (
        <p className="py-6 text-center text-sm text-ink-700">Working out who owes who…</p>
      )}

      {balances.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{(balances.error as Error).message}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* ---------- Settlement plan, first ---------- */}
          {/* Above the balance sheet on purpose: "pay Josh $20.67" is the
              thing someone opened this screen to find out. The balances below
              are the explanation, and an explanation belongs after the
              answer. */}
          <section>
            <h3 className="text-xs font-semibold tracking-wide text-ink-700 uppercase">
              Settle up
            </h3>

            {data.settlements.length === 0 ? (
              <p className="mt-2 text-sm text-ink-700">
                {data.balances.length === 0
                  ? 'No expenses have been recorded for this trip yet.'
                  : 'Everyone is settled up. No payments needed.'}
              </p>
            ) : (
              <>
                <ul className="mt-2 space-y-2">
                  {data.settlements.map((settlement) => (
                    <SettlementRow
                      key={`${settlement.from.id}-${settlement.to.id}`}
                      settlement={settlement}
                      youId={youId}
                    />
                  ))}
                </ul>

                <p className="mt-2 text-xs text-ink-700">
                  {data.settlements.length}{' '}
                  {data.settlements.length === 1 ? 'payment' : 'payments'} clears every balance.
                  TripSquad does not move money - settle up however you normally would.
                </p>
              </>
            )}
          </section>

          {/* ---------- The balance sheet ---------- */}
          {data.balances.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold tracking-wide text-ink-700 uppercase">
                Everyone's balance
              </h3>

              <ul className="mt-2 space-y-2">
                {data.balances.map((entry) => (
                  <BalanceRow
                    key={entry.user.id}
                    entry={entry}
                    isYou={entry.user.id === youId}
                  />
                ))}
              </ul>

              <p className="mt-2 text-xs text-ink-700">
                Balances are worked out from every expense each time you open this - nothing is
                stored, so they cannot go stale.
              </p>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
