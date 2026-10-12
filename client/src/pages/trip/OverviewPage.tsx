/**
 * FILE: OverviewPage.tsx
 * DESCRIPTION: The trip workspace landing page. A high-level summary, not
 *              another management screen.
 *
 *              This is the one page in the shell PR with REAL data: the
 *              general information and members cards come from
 *              GET /api/trips/:tripId, which proves the whole stack end to end.
 *              The four feature summary cards are placeholders until each
 *              owner builds their list endpoint.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { get } from '../../lib/api';

// -------------------- Type imports --------------------
import type { TripDetailResponse } from '../../types/api';

// -------------------- Component imports --------------------
import { TripStatusBadge } from '../../components/TripStatusBadge';

// -------------------- Internal Helpers --------------------

/**
 * "2027-04-07" -> "4/7/27".
 *
 * The T00:00:00 suffix forces LOCAL parsing. A bare "2027-04-07" is parsed as
 * UTC midnight, which displays as the previous day for anyone west of
 * Greenwich - a classic off-by-one-day bug.
 */
function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  });
}

// -------------------- Card Shell --------------------

/** The repeated card chrome. Local to this file until a second page needs it. */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Placeholder body for the cards whose feature is not built yet. */
function NotBuiltYet({ feature }: { feature: string }) {
  return <p className="text-sm text-slate-400">{feature} is not built yet.</p>;
}

// -------------------- Component --------------------
export function OverviewPage() {
  const { tripId } = useParams();

  const trip = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => get<TripDetailResponse>(`/trips/${tripId}`),
    // Without this the query fires once with `undefined` in the URL before
    // the param resolves, producing a pointless 404.
    enabled: Boolean(tripId),
  });

  // ----- Loading and error states -----
  if (trip.isLoading) {
    return <p className="text-slate-500">Loading trip…</p>;
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

  const { trip: data } = trip.data;
  const shownMembers = data.members.slice(0, 2);

  // ----- Render -----
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Trip Overview</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------- General information (real data) ---------- */}
        <Card title="General Information">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Name</dt>
              <dd className="text-sm font-medium text-slate-900">{data.name}</dd>
            </div>

            <div>
              <dt className="text-xs text-slate-500">Trip Owner</dt>
              <dd className="text-sm font-medium text-slate-900">
                {data.createdBy.displayName}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-slate-500">Destination</dt>
              <dd className="text-sm font-medium text-slate-900">{data.destination}</dd>
            </div>

            <div>
              <dt className="text-xs text-slate-500">Status</dt>
              <dd className="mt-0.5">
                <TripStatusBadge status={data.status} />
              </dd>
            </div>

            <div>
              <dt className="text-xs text-slate-500">Dates</dt>
              <dd className="text-sm font-medium text-slate-900">
                {formatDate(data.startDate)} - {formatDate(data.endDate)}
              </dd>
            </div>

            {data.description && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">Description</dt>
                <dd className="text-sm text-slate-700">{data.description}</dd>
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
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    aria-hidden="true"
                    className="h-8 w-8 shrink-0 rounded-full bg-slate-200"
                  />
                  <span className="text-sm text-slate-900">{member.user.displayName}</span>
                </div>
                <span className="text-xs text-slate-500">{member.role}</span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-slate-500">
            Showing {shownMembers.length} of {data.members.length} members.{' '}
            <Link to="members" className="font-medium text-slate-700 hover:underline">
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
    </div>
  );
}
