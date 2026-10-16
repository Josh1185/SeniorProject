/**
 * FILE: OverviewPage.tsx
 * DESCRIPTION: The trip workspace landing page. A high-level summary, not
 *              another management screen.
 *
 *              General information and members come from
 *              GET /api/trips/:tripId. The four feature summary cards are
 *              placeholders until each owner builds their list endpoint.
 *
 *              Edit and Delete live here rather than on a Settings page,
 *              because this is already the trip's "about" screen and the
 *              sidebar has no Settings entry. Both are OWNER-only in the UI;
 *              the server enforces it for real via requireTripRole('OWNER').
 *
 * LAST UPDATED: 2026-10-16 - Member initials via Avatar (Josh Iehle)
 *               2026-10-13 - Hooks, owner actions, date fix (Josh Iehle)
 *               2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ReactNode } from 'react';

// -------------------- Module and lib imports --------------------
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useDeleteTrip } from '../../hooks/trips/useDeleteTrip';
import { useTrip } from '../../hooks/trips/useTrip';
import { formatDateRange } from '../../lib/format';

// -------------------- Component imports --------------------
import { Avatar } from '../../components/Avatar';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TripFormModal } from '../../components/TripFormModal';
import { TripStatusBadge } from '../../components/TripStatusBadge';

// -------------------- Internal Components --------------------

/** The repeated card chrome. Local to this file until a second page needs it. */
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-ink-300 bg-ink-50 p-5">
      <h2 className="text-xs font-semibold tracking-wide text-brand-600 uppercase">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** One label/value pair inside the general information card. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-700">{label}</dt>
      <dd className="text-sm font-medium text-ink-900">{children}</dd>
    </div>
  );
}

/** Placeholder body for the cards whose feature is not built yet. */
function NotBuiltYet({ feature }: { feature: string }) {
  return <p className="text-sm text-ink-700">{feature} is not built yet.</p>;
}

// -------------------- Component --------------------
export function OverviewPage() {
  // ----- 1. State Management -----
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ----- 2. Hook usage -----
  const trip = useTrip(tripId);
  const deleteTrip = useDeleteTrip(tripId ?? '');

  // ----- 3. Loading and error states -----
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

  if (!trip.data) return null;

  const { trip: data, yourRole } = trip.data;
  const isOwner = yourRole === 'OWNER';
  const shownMembers = data.members.slice(0, 3);

  // ----- 4. Render -----
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink-900">Trip Overview</h1>

        {/* Hiding these from members is a convenience, not a security control.
            requireTripRole('OWNER') on the server is what actually stops a
            member deleting a trip. */}
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

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------- General information (real data) ---------- */}
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

        {/* ---------- Members (real data) ---------- */}
        <Card title="Members">
          <ul className="space-y-2">
            {shownMembers.map((member) => (
              <li
                key={member.user.id}
                className="flex items-center justify-between rounded-md border border-ink-300 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {/* Initials rather than an empty grey circle. Profile picture
                      upload is out of scope, so avatarUrl is null for almost
                      everyone and the fallback IS the normal case. */}
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

        {/* ---------- Feature summaries (placeholders) ---------- */}
        <Card title="Activities">
          <NotBuiltYet feature="Activity voting" />
        </Card>

        <Card title="Upcoming Itinerary">
          <NotBuiltYet feature="The itinerary" />
        </Card>

        <Card title="Expenses">
          <NotBuiltYet feature="Expense tracking" />
        </Card>

        <Card title="Reservations">
          <NotBuiltYet feature="Reservations" />
        </Card>
      </div>

      {/* ---------- Owner dialogs ---------- */}
      <TripFormModal open={editOpen} onClose={() => setEditOpen(false)} trip={data} />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this trip?"
        // Naming the consequence explicitly. "Are you sure?" tells someone
        // nothing they did not already know.
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
