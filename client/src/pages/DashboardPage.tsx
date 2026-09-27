/**
 * FILE: DashboardPage.tsx
 * DESCRIPTION: Protected page for main information
 *
 *              Note that this current structure that returns
 *              current user data is temporary,
 *              and solely for testing auth sessions work
 *
 * LAST UPDATED: 2026-09-26 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api';
import { useAuth } from '../lib/auth/useAuth';

// -------------------- Response Structure Interface --------------------
interface SignedInUserResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    createdAt: string;
  };
}

// -------------------- Component --------------------
export function DashboardPage() {
  // ----- 1. Destructure signOut method from useAuth -----
  const { signOut } = useAuth();

  // ----- 2. Obtain signed in user data -----
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => get<SignedInUserResponse>('/me'),
  });

  // ----- 3. Render -----
  return (
    <div className="mx-auto max-w-2xl p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <button
          onClick={() => void signOut()}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Sign out
        </button>
      </header>

      <div className="mt-8 rounded-lg bg-white p-6 ring-1 ring-slate-200">
        {me.isLoading && <p className="text-slate-500">Loading…</p>}
        {me.error && <p className="text-red-600">{(me.error as Error).message}</p>}

        {me.data && (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium">{me.data.user.displayName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium">{me.data.user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">User ID</dt>
              <dd className="font-mono text-xs">{me.data.user.id}</dd>
            </div>
          </dl>
        )}
      </div>

      <p className="mt-4 text-sm text-slate-500">
        This data came from our API, which verified your token and looked you up in our own
        database.
      </p>
    </div>
  );
}
