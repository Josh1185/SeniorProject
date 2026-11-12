/**
 * FILE: ReservationsPage.tsx
 * DESCRIPTION: Displays a trip's reservations with search,
 *              type filtering, sorting, loading/error handling,
 *              empty states, and a reservation detail modal.
 *
 * LAST UPDATED: 2026-11-12 - Add reservation detail modal (Antony Benitez)
 *               2026-11-04 - Build Reservations list page (Antony Benitez)
 *               2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------

import type {
  ReservationListItem,
  ReservationType,
} from '../../types/api';

import type { ReservationFilters } from '../../services/reservationService';

import type { Column } from '../../components/list/listTypes';

// -------------------- Module and lib imports --------------------

import { useState } from 'react';
import { useParams } from 'react-router';
import { unpackSort } from '../../lib/listParams';
import { formatCents } from '../../lib/format';

// -------------------- Hook imports --------------------

import { useReservations } from '../../hooks/reservations/useReservations';
import { useListQueryState } from '../../hooks/useListQueryState';

// -------------------- Component imports --------------------

import { DataList } from '../../components/list/DataList';
import { EmptyState } from '../../components/list/EmptyState';
import { ListToolbar } from '../../components/list/ListToolbar';

import { ReservationDetailModal } from '../../components/reservations/ReservationDetailModal';

// -------------------- List Defaults --------------------

const RESERVATION_LIST_DEFAULTS = {
  search: '',
  type: '',
  sort: 'startDateTime:asc',
};

// -------------------- Type Filter Options --------------------

const TYPE_OPTIONS = [
  { value: '', label: 'Filter: All' },
  { value: 'FLIGHT', label: 'Flights' },
  { value: 'HOTEL', label: 'Hotels' },
  { value: 'RENTAL_CAR', label: 'Rental Cars' },
  { value: 'RESTAURANT', label: 'Restaurants' },
  { value: 'ATTRACTION', label: 'Attractions' },
  { value: 'OTHER', label: 'Other' },
];

// -------------------- Sort Options --------------------

const SORT_OPTIONS = [
  { value: 'startDateTime:asc', label: 'Sort: Earliest first' },
  { value: 'startDateTime:desc', label: 'Sort: Latest first' },
  { value: 'createdAt:desc', label: 'Sort: Recently added' },
  { value: 'createdAt:asc', label: 'Sort: Oldest added' },
  { value: 'name:asc', label: 'Sort: Name A-Z' },
  { value: 'name:desc', label: 'Sort: Name Z-A' },
];

// -------------------- Display Helpers --------------------

function formatReservationType(type: ReservationType): string {
  switch (type) {
    case 'FLIGHT':
      return 'Flight';

    case 'HOTEL':
      return 'Hotel';

    case 'RENTAL_CAR':
      return 'Rental Car';

    case 'RESTAURANT':
      return 'Restaurant';

    case 'ATTRACTION':
      return 'Attraction';

    case 'OTHER':
      return 'Other';
  }
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatReservationCost(costCents: number | null): string {
  if (costCents === null) {
    return '—';
  }

  return formatCents(costCents);
}

// -------------------- Table Columns --------------------

const RESERVATION_COLUMNS: Column<ReservationListItem>[] = [
  {
    header: 'TITLE',
    cell: (reservation) => (
      <div>
        <p className="font-medium text-ink-900">
          {reservation.name}
        </p>

        {reservation.confirmationNumber && (
          <p className="mt-1 text-xs text-ink-700">
            Confirmation: {reservation.confirmationNumber}
          </p>
        )}
      </div>
    ),
  },

  {
    header: 'TYPE',
    cell: (reservation) => (
      <span className="inline-block rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-900">
        {formatReservationType(reservation.type)}
      </span>
    ),
  },

  {
    header: 'START',
    cell: (reservation) => (
      <span className="text-sm text-ink-700">
        {formatDateTime(reservation.startDateTime)}
      </span>
    ),
  },

  {
    header: 'LOCATION',
    cell: (reservation) => (
      <span className="text-sm text-ink-700">
        {reservation.locationName ?? '—'}
      </span>
    ),
  },

  {
    header: 'COST',
    cell: (reservation) => (
      <span className="text-sm font-medium text-ink-900">
        {formatReservationCost(reservation.costCents)}
      </span>
    ),
  },
];

// -------------------- Mobile Card --------------------

function renderReservationCard(reservation: ReservationListItem) {
  return (
    <div className="rounded-lg border border-ink-300 bg-white p-4">
      {/* Title and reservation type */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-ink-900">
          {reservation.name}
        </h2>

        <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-900">
          {formatReservationType(reservation.type)}
        </span>
      </div>

      {/* Reservation information */}
      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-xs text-ink-700">Start</p>
          <p className="mt-1 text-ink-900">
            {formatDateTime(reservation.startDateTime)}
          </p>
        </div>

        {reservation.endDateTime && (
          <div>
            <p className="text-xs text-ink-700">End</p>
            <p className="mt-1 text-ink-900">
              {formatDateTime(reservation.endDateTime)}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs text-ink-700">Location</p>
          <p className="mt-1 text-ink-900">
            {reservation.locationName ?? '—'}
          </p>
        </div>

        {reservation.confirmationNumber && (
          <div>
            <p className="text-xs text-ink-700">
              Confirmation Number
            </p>

            <p className="mt-1 break-all text-ink-900">
              {reservation.confirmationNumber}
            </p>
          </div>
        )}

        <div className="border-t border-ink-300 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-700">Cost</span>

            <span className="font-semibold text-ink-900">
              {formatReservationCost(reservation.costCents)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------- Main Component --------------------

export function ReservationsPage() {
  // ----- 1. Identify the current trip -----

  const { tripId } = useParams();

  // ----- 2. Track the reservation selected for the modal -----

  const [selectedReservation, setSelectedReservation] =
    useState<ReservationListItem | null>(null);

  // ----- 3. Read filters and sorting from the URL -----

  const list = useListQueryState({
    defaults: RESERVATION_LIST_DEFAULTS,
  });

  const { sort, order } = unpackSort(
    list.values.sort,
    'startDateTime',
    'asc',
  );

  // ----- 4. Build API filters -----

  const filters: ReservationFilters = {
    search: list.values.search || undefined,

    type: list.values.type
      ? (list.values.type as ReservationType)
      : undefined,

    sort: sort as ReservationFilters['sort'],

    order: order as ReservationFilters['order'],
  };

  // ----- 5. Fetch reservations -----

  const reservations = useReservations(tripId, filters);

  const results = reservations.data?.reservations ?? [];

  const isFiltering = Boolean(
    list.values.search.trim() || list.values.type,
  );

  // ----- 6. Render the page -----

  return (
    <div>
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Trip Reservations
        </h1>

        <p className="mt-1 text-sm text-ink-700">
          View and organize reservations for this trip.
        </p>
      </div>

      {/* Search, type filtering, and sorting */}
      <div className="mt-4">
        <ListToolbar
          searchValue={list.searchInput}
          onSearchChange={list.setSearchInput}
          searchPlaceholder="Search reservations…"
          selects={[
            {
              name: 'Type',
              value: list.values.type,
              options: TYPE_OPTIONS,
              onChange: (value) => list.setValue('type', value),
            },
            {
              name: 'Sort',
              value: list.values.sort,
              options: SORT_OPTIONS,
              onChange: (value) => list.setValue('sort', value),
            },
          ]}
        />
      </div>

      {/* Reservation content */}
      <div className="mt-6">
        {/* Loading state */}
        {reservations.isLoading && (
          <p className="py-12 text-center text-ink-700">
            Loading reservations…
          </p>
        )}

        {/* Error state with retry */}
        {reservations.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">
              {(reservations.error as Error).message}
            </p>

            <button
              type="button"
              onClick={() => void reservations.refetch()}
              className="mt-2 cursor-pointer text-sm text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state: trip has no reservations */}
        {!reservations.isLoading &&
          !reservations.error &&
          results.length === 0 &&
          !isFiltering && (
            <EmptyState
              title="No reservations yet"
              description="Reservations added to this trip will appear here."
            />
          )}

        {/* Empty state: no search or filter matches */}
        {!reservations.isLoading &&
          !reservations.error &&
          results.length === 0 &&
          isFiltering && (
            <EmptyState
              title="No reservations match your filters"
              description="Try another search or reservation type."
              action={
                <button
                  type="button"
                  onClick={list.reset}
                  className="cursor-pointer rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-100"
                >
                  Clear filters
                </button>
              }
            />
          )}

        {/* Reservation results */}
        {!reservations.isLoading &&
          !reservations.error &&
          results.length > 0 && (
            <>
              <DataList
                items={results}
                getKey={(reservation) => reservation.id}
                columns={RESERVATION_COLUMNS}
                renderCard={renderReservationCard}
                onItemClick={setSelectedReservation}
              />

              <p className="mt-4 text-sm text-ink-700">
                Showing {results.length}{' '}
                {results.length === 1
                  ? 'reservation'
                  : 'reservations'}
              </p>
            </>
          )}
      </div>

      {/* R4: Selected reservation detail modal */}
      <ReservationDetailModal
        tripId={tripId}
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
      />
    </div>
  );
}