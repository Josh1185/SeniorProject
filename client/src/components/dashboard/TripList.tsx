/**
 * FILE: TripList.tsx
 * DESCRIPTION: The trip list, built on DataList.
 *
 *              THIS IS THE WORKED EXAMPLE for DataList. Activities,
 *              reservations and expenses lists should copy this shape: a
 *              module-level `columns` array for the desktop table, a small
 *              local card component for mobile, and DataList wiring the two
 *              together.
 *
 *              All the responsive plumbing - the hidden table, the stacked
 *              cards, the header row, the hover styling - now lives in
 *              DataList. What is left in this file is only what is specific to
 *              a trip.
 *
 * LAST UPDATED: 2026-10-16 - Rebuilt on DataList (Josh Iehle)
 *               2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { TripListItem } from '../../types/api';
import type { Column } from '../list/listTypes';

// -------------------- Module and lib imports --------------------
import { Link } from 'react-router';
import { formatDateRange } from '../../lib/format';

// -------------------- Component imports --------------------
import { DataList } from '../list/DataList';
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

/** One mobile card. The whole card is the link here, unlike the table row. */
function TripCard({ trip }: { trip: TripListItem }) {
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="flex items-start justify-between gap-3 rounded-lg border border-ink-300 p-4 duration-150 hover:bg-ink-100"
    >
      <div className="min-w-0">
        {/* truncate needs min-w-0 on the flex parent, or a long trip name
            pushes the badges off the card instead of ellipsing. */}
        <p className="truncate font-medium text-ink-900">{trip.name}</p>
        <p className="mt-1 text-sm text-ink-700">{trip.destination}</p>
        <p className="mt-1 text-sm text-ink-700">{formatDateRange(trip.startDate, trip.endDate)}</p>
        <p className="mt-1 text-sm text-ink-700">
          {trip.memberCount} {trip.memberCount === 1 ? 'member' : 'members'}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <TripStatusBadge status={trip.status} />
        <RoleBadge role={trip.yourRole} />
      </div>
    </Link>
  );
}

// -------------------- Columns --------------------

/**
 * The desktop table, one entry per column.
 *
 * At module scope rather than inside the component because nothing here
 * depends on props - so it is built once rather than on every render.
 */
const TRIP_COLUMNS: Column<TripListItem>[] = [
  {
    header: 'Title',
    cell: (trip) => (
      // The link lives on the title rather than the whole row. A row-wide
      // click target cannot be focused by keyboard, opened in a new tab, or
      // copied as a link. The mobile card can get away with it because the
      // card IS a single link element.
      <Link
        to={`/trips/${trip.id}`}
        className="font-medium text-ink-900 duration-150 hover:text-brand-600"
      >
        {trip.name}
      </Link>
    ),
  },
  {
    header: 'Main Destination',
    cell: (trip) => trip.destination,
    className: 'text-sm text-ink-700',
  },
  {
    header: 'Dates',
    cell: (trip) => formatDateRange(trip.startDate, trip.endDate),
    className: 'text-sm text-ink-700',
  },
  {
    header: 'Members',
    cell: (trip) => trip.memberCount,
    className: 'text-sm text-ink-700',
  },
  {
    header: 'Status',
    cell: (trip) => <TripStatusBadge status={trip.status} />,
  },
  {
    header: 'Role',
    cell: (trip) => <RoleBadge role={trip.yourRole} />,
  },
];

// -------------------- Component --------------------
export function TripList({ trips }: TripListProps) {
  return (
    <DataList
      items={trips}
      getKey={(trip) => trip.id}
      columns={TRIP_COLUMNS}
      renderCard={(trip) => <TripCard trip={trip} />}
    />
  );
}
