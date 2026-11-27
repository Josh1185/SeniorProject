/**
 * FILE: OverviewPage.tsx
 * DESCRIPTION: Trip workspace overview displaying trip information,
 *              members, itinerary, and reservations.
 *
 * LAST UPDATED: 2026-11-27 - Add activities overview (Brandon Douglass)
 *               2026-11-23 - Add scrollable reservations overview (Antony Benitez)
 *               2026-10-16 - Member initials via Avatar (Josh Iehle)
 *               2026-10-13 - Hooks, owner actions, date fix (Josh Iehle)
 *               2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ReactNode } from 'react';
import type { ReservationType } from '../../types/api';

// -------------------- Module and lib imports --------------------
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { useDeleteTrip } from '../../hooks/trips/useDeleteTrip';
import { useTrip } from '../../hooks/trips/useTrip';
import { useItinerary } from '../../hooks/itinerary/useItinerary';
import { useActivities } from '../../hooks/activities/useActivities';
import { useReservations } from '../../hooks/reservations/useReservations';

import { formatCents, formatDateRange } from '../../lib/format';

// -------------------- Component imports --------------------
import { Avatar } from '../../components/Avatar';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TripFormModal } from '../../components/TripFormModal';
import { TripStatusBadge } from '../../components/TripStatusBadge';
import { ItineraryList } from '../../components/itinerary/ItineraryList';

// -------------------- Internal Components --------------------

/** Shared card styling for Trip Overview sections. */
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-ink-300 bg-ink-50 p-5">
      <h2 className="text-xs font-semibold tracking-wide text-brand-600 uppercase">{title}</h2>

      <div className="mt-3">{children}</div>
    </section>
  );
}

/** One label/value pair in the general information card. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-700">{label}</dt>
      <dd className="text-sm font-medium text-ink-900">{children}</dd>
    </div>
  );
}

/** Placeholder for features that have not been implemented. */
function NotBuiltYet({ feature }: { feature: string }) {
  return <p className="text-sm text-ink-700">{feature} is not built yet.</p>;
}

// -------------------- Reservation Helpers --------------------

/** Converts reservation enum values to readable labels. */
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

/** Formats a reservation's starting date and time. */
function formatReservationDate(value: string | null): string {
  if (!value) {
    return 'Date not set';
  }

  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// -------------------- Main Component --------------------

export function OverviewPage() {
  // ----- 1. State Management -----

  const { tripId } = useParams();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ----- 2. Hook Usage -----

  const trip = useTrip(tripId);

  const itinerary = useItinerary(tripId);

  const activities = useActivities(tripId);

  const reservations = useReservations(tripId, {
    sort: 'startDateTime',
    order: 'asc',
  });

  const deleteTrip = useDeleteTrip(tripId ?? '');

  // ----- 3. Loading and Error States -----

  if (trip.isLoading) {
    return <p className="text-ink-700">Loading trip…</p>;
  }

  if (trip.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-700">{(trip.error as Error).message}</p>

        <Link to="/dashboard" className="mt-2 inline-block text-sm text-red-700 underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!trip.data) {
    return null;
  }

  // ----- 4. Page Data -----

  const { trip: data, yourRole } = trip.data;

  const isOwner = yourRole === 'OWNER';

  const shownMembers = data.members.slice(0, 3);

  const activityItems = [...(activities.data?.activities ?? [])].sort((a, b) => {
    if (!a.suggestedDateTime && !b.suggestedDateTime) return 0;
    if (!a.suggestedDateTime) return 1;
    if (!b.suggestedDateTime) return -1;

    return new Date(a.suggestedDateTime).getTime() - new Date(b.suggestedDateTime).getTime();
  });

  const reservationItems = reservations.data?.reservations ?? [];

  // ----- 5. Render -----

  return (
    <div className="space-y-4">
      {/* ---------- Page Heading ---------- */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink-900">Trip Overview</h1>

        {isOwner && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="cursor-pointer rounded-md border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 duration-150 hover:bg-ink-100"
            >
              Edit Trip
            </button>

            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="cursor-pointer rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 duration-150 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* ---------- Overview Grid ---------- */}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------- General Information ---------- */}

        <Card title="General Information">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">{data.name}</Field>

            <Field label="Trip Owner">{data.createdBy.displayName}</Field>

            <Field label="Destination">{data.destination}</Field>

            <Field label="Dates">{formatDateRange(data.startDate, data.endDate)}</Field>

            <div>
              <dt className="text-xs text-ink-700">Status</dt>

              <dd className="mt-0.5">
                <TripStatusBadge status={data.status} />
              </dd>
            </div>

            {data.description && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-ink-700">Description</dt>

                <dd className="text-sm text-ink-900">{data.description}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* ---------- Members ---------- */}

        <Card title="Members">
          <ul className="space-y-2">
            {shownMembers.map((member) => (
              <li
                key={member.user.id}
                className="flex items-center justify-between rounded-md border border-ink-300 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar
                    displayName={member.user.displayName}
                    avatarUrl={member.user.avatarUrl}
                    size="sm"
                  />

                  <span className="text-sm text-ink-900">{member.user.displayName}</span>
                </div>

                <span className="text-xs text-ink-700">{member.role}</span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-ink-700">
            Showing {shownMembers.length} of {data.members.length} members.{' '}
            <Link to="members" className="font-medium text-brand-600 hover:underline">
              View All &gt;
            </Link>
          </p>
        </Card>

        {/* ---------- Activities ---------- */}

        <Card title="Activities">
          {/* Loading State */}

          {activities.isLoading && <p className="text-sm text-ink-700">Loading activities…</p>}

          {/* Error State */}

          {activities.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{(activities.error as Error).message}</p>

              <button
                type="button"
                onClick={() => void activities.refetch()}
                className="mt-2 cursor-pointer text-sm text-red-700 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}

          {!activities.isLoading && !activities.error && activityItems.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-ink-700">No activities added to this trip yet.</p>

              <Link
                to="activities"
                className="inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                Add Activity &gt;
              </Link>
            </div>
          )}

          {/* Activities List */}

          {!activities.isLoading && !activities.error && activityItems.length > 0 && (
            <div className="space-y-3">
              {/* Activity Count and View All */}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-ink-700">
                  Showing {activityItems.length}{' '}
                  {activityItems.length === 1 ? 'activity' : 'activities'}
                </p>

                <Link
                  to="activities"
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  View All &gt;
                </Link>
              </div>

              {/* Scrollable List */}

              <div
                role="region"
                aria-label="Trip activity summaries"
                tabIndex={0}
                className="max-h-[400px] space-y-3 overflow-y-auto overscroll-contain pr-2"
              >
                {activityItems.map((activity) => (
                  <div key={activity.id} className="rounded-lg border border-ink-300 p-4">
                    {/* Activity Name and Vote Count */}

                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-ink-900">{activity.name}</h3>

                      <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-900">
                        {activity.voteLength} {activity.voteLength === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>

                    {/* Suggested Date and Time */}

                    <p className="mt-2 text-xs text-ink-700">
                      {activity.suggestedDateTime
                        ? new Date(activity.suggestedDateTime).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'Date and time TBD'}
                    </p>

                    {/* Location */}

                    {activity.locationName && (
                      <p className="mt-1 text-xs text-ink-700">{activity.locationName}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* ---------- Itinerary ---------- */}

        <Card title="Itinerary">
          <div className="max-h-[400px] overflow-y-auto pr-2">
            {itinerary.isLoading && <p className="text-sm text-ink-700">Loading itinerary…</p>}

            {itinerary.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{(itinerary.error as Error).message}</p>

                <button
                  type="button"
                  onClick={() => void itinerary.refetch()}
                  className="mt-2 cursor-pointer text-sm text-red-700 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {!itinerary.isLoading && !itinerary.error && itinerary.data && (
              <ItineraryList
                tripId={tripId}
                startDate={itinerary.data.startDate}
                endDate={itinerary.data.endDate}
                events={itinerary.data.events}
                showAddEvent={false}
              />
            )}
          </div>
        </Card>

        {/* ---------- Expenses ---------- */}

        <Card title="Expenses">
          <NotBuiltYet feature="Expense tracking" />
        </Card>

        {/* ---------- Reservations (R3-R5) ---------- */}

        <Card title="Reservations">
          {/* Loading State */}

          {reservations.isLoading && <p className="text-sm text-ink-700">Loading reservations…</p>}

          {/* Error State */}

          {reservations.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{(reservations.error as Error).message}</p>

              <button
                type="button"
                onClick={() => void reservations.refetch()}
                className="mt-2 cursor-pointer text-sm text-red-700 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}

          {!reservations.isLoading && !reservations.error && reservationItems.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-ink-700">No reservations added to this trip yet.</p>

              <Link
                to="reservations"
                className="inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                Add Reservation &gt;
              </Link>
            </div>
          )}

          {/* Reservations List */}

          {!reservations.isLoading && !reservations.error && reservationItems.length > 0 && (
            <div className="space-y-3">
              {/* Reservation Count and View All */}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-ink-700">
                  Showing {reservationItems.length}{' '}
                  {reservationItems.length === 1 ? 'reservation' : 'reservations'}
                </p>

                <Link
                  to="reservations"
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  View All &gt;
                </Link>
              </div>

              {/* Scrollable List */}

              <div
                role="region"
                aria-label="Trip reservation summaries"
                tabIndex={0}
                className="max-h-[400px] space-y-3 overflow-y-auto overscroll-contain pr-2"
              >
                {reservationItems.map((reservation) => (
                  <div key={reservation.id} className="rounded-lg border border-ink-300 p-4">
                    {/* Reservation Name and Type */}

                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-ink-900">{reservation.name}</h3>

                      <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-900">
                        {formatReservationType(reservation.type)}
                      </span>
                    </div>

                    {/* Start Date and Time */}

                    <div className="mt-3">
                      <p className="text-xs text-ink-700">Start</p>

                      <p className="mt-1 text-sm text-ink-900">
                        {formatReservationDate(reservation.startDateTime)}
                      </p>
                    </div>

                    {/* Location */}

                    {reservation.locationName && (
                      <div className="mt-3">
                        <p className="text-xs text-ink-700">Location</p>

                        <p className="mt-1 text-sm text-ink-900">{reservation.locationName}</p>
                      </div>
                    )}

                    {/* Confirmation Number */}

                    {reservation.confirmationNumber && (
                      <div className="mt-3">
                        <p className="text-xs text-ink-700">Confirmation</p>

                        <p className="mt-1 break-all text-sm text-ink-900">
                          {reservation.confirmationNumber}
                        </p>
                      </div>
                    )}

                    {/* Cost */}

                    <div className="mt-3 flex items-center justify-between border-t border-ink-300 pt-3">
                      <span className="text-xs text-ink-700">Cost</span>

                      <span className="text-sm font-semibold text-ink-900">
                        {reservation.costCents !== null ? formatCents(reservation.costCents) : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ---------- Owner Dialogs ---------- */}

      <TripFormModal open={editOpen} onClose={() => setEditOpen(false)} trip={data} />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this trip?"
        description={`"${data.name}" and everything in it - activities, expenses, reservations and the itinerary - will be permanently deleted for all ${data.members.length} members. This cannot be undone.`}
        confirmLabel="Delete Trip"
        destructive
        pending={deleteTrip.isPending}
        onConfirm={async () => {
          await deleteTrip.mutateAsync();
          navigate('/dashboard', { replace: true });
        }}
      />
    </div>
  );
}
