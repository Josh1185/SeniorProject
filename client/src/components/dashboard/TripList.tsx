/**
 * FILE: TripList.tsx
 * DESCRIPTION: The trip list itself: a table on desktop, stacked cards on
 *              mobile.
 *
 *              BOTH are rendered and one is hidden with CSS, rather than
 *              measuring the viewport in JavaScript. That means no layout
 *              shift on load, no resize listener, and it works before
 *              hydration. The cost is duplicated DOM for a few dozen rows,
 *              which is nothing.
 *
 *              When this gets extracted into a reusable list component (the
 *              activities, reservations and expenses lists want the same
 *              shape), the two render functions below are the parts to
 *              generalise - probably as a `columns` definition plus a
 *              `renderCard` callback.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { TripListItem } from '../../types/api';

// -------------------- Module and lib imports --------------------
import { Link } from 'react-router';
import { formatDateRange } from '../../lib/format';

// -------------------- Component imports --------------------
import { TripStatusBadge } from '../../components/TripStatusBadge';

// -------------------- Props interface --------------------
interface TripListProps {
  trips: TripListItem[];
}

// -------------------- Internal Components --------------------

/** The role pill. Quieter than the status badge - role is secondary info. */
function RoleBadge({ role }: { role: TripListItem['yourRole'] }) {
  if (!role) return null;

  return (
    <span className="inline-block rounded-full bg-ink-200 px-3 py-1 text-xs font-medium text-ink-700">
      {role === 'OWNER' ? 'Owner' : 'Member'}
    </span>
  );
}

// -------------------- Component --------------------
export function TripList({ trips }: TripListProps) {
  return (
    <>
      {/* ==================== Desktop: table ==================== */}
      <div className="hidden lg:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-ink-300 text-left">
              {['Title', 'Main Destination', 'Dates', 'Members', 'Status', 'Role'].map(
                (heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-3 py-3 text-xs font-semibold tracking-wide text-brand-600 uppercase"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id} className="border-b border-ink-300 duration-150 hover:bg-ink-100">
                <td className="px-3 py-3">
                  {/* The link lives on the title rather than the whole row.
                      A row-wide click target cannot be focused by keyboard,
                      opened in a new tab, or copied as a link. */}
                  <Link
                    to={`/trips/${trip.id}`}
                    className="font-medium text-ink-900 duration-150 hover:text-brand-600"
                  >
                    {trip.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-sm text-ink-700">{trip.destination}</td>
                <td className="px-3 py-3 text-sm text-ink-700">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </td>
                <td className="px-3 py-3 text-sm text-ink-700">{trip.memberCount}</td>
                <td className="px-3 py-3">
                  <TripStatusBadge status={trip.status} />
                </td>
                <td className="px-3 py-3">
                  <RoleBadge role={trip.yourRole} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ==================== Mobile: cards ==================== */}
      <ul className="space-y-3 lg:hidden">
        {trips.map((trip) => (
          <li key={trip.id}>
            <Link
              to={`/trips/${trip.id}`}
              className="flex items-start justify-between gap-3 rounded-lg border border-ink-300 p-4 duration-150 hover:bg-ink-100"
            >
              <div className="min-w-0">
                {/* truncate needs min-w-0 on the flex parent, or a long trip
                    name pushes the badges off the card instead of ellipsing. */}
                <p className="truncate font-medium text-ink-900">{trip.name}</p>
                <p className="mt-1 text-sm text-ink-700">{trip.destination}</p>
                <p className="mt-1 text-sm text-ink-700">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </p>
                <p className="mt-1 text-sm text-ink-700">
                  {trip.memberCount} {trip.memberCount === 1 ? 'member' : 'members'}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <TripStatusBadge status={trip.status} />
                <RoleBadge role={trip.yourRole} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
