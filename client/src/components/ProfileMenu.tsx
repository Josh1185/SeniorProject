/**
 * FILE: ProfileMenu.tsx
 * DESCRIPTION: Avatar button in the header that opens a dropdown with the
 *              signed-in user's name, a larger avatar and a log out button.
 *
 *              Profile editing is out of scope. This is identity + sign out.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { get } from '../lib/api';
import { useAuth } from '../lib/auth/useAuth';

// -------------------- Type imports --------------------
import type { SignedInUserResponse } from '../types/api';

// -------------------- Internal Helpers --------------------

/** "Josh Iehle" -> "JI". Fallback avatar when the user has no picture. */
function initials(displayName: string): string {
  return displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

// -------------------- Component --------------------
export function ProfileMenu() {
  // ----- 1. State and refs -----
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  // Wraps both the button and the dropdown, so "did the click land inside
  // this menu?" is a single contains() check.
  const containerRef = useRef<HTMLDivElement>(null);

  // ----- 2. The signed-in user -----
  // Same query key as anywhere else that needs the current user, so React
  // Query serves it from cache instead of refetching per component.
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => get<SignedInUserResponse>('/users/me'),
  });

  // ----- 3. Close on outside click and on Escape -----
  useEffect(() => {
    // Nothing to listen for while the menu is shut. Bailing early means we are
    // not holding two document-level listeners for every closed dropdown.
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      // event.target is typed as EventTarget, which has no DOM methods, so it
      // has to be narrowed before contains() will accept it.
      const target = event.target;
      if (target instanceof Node && !containerRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    // pointerdown rather than click: it fires before focus moves, so the menu
    // closes immediately instead of after the mouse button comes back up.
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup is not optional. Without it every open/close cycle leaves a
    // listener behind and they accumulate for the life of the page.
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const user = me.data?.user;
  const name = user?.displayName ?? '';

  // ----- 4. Render -----
  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        // Tells screen readers this button owns a menu and whether it is open.
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-slate-200 text-sm font-medium text-slate-700 hover:ring-2 hover:ring-brand-500"
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials(name)
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
        >
          <div className="flex flex-col items-center gap-2 border-b border-slate-100 pb-4">
            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-slate-200 text-xl font-medium text-slate-700">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(name)
              )}
            </div>

            <div className="text-center">
              <p className="font-medium text-slate-900">{name || 'Loading…'}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            // void: we are deliberately not awaiting. Without it ESLint flags
            // an unhandled floating promise.
            onClick={() => void signOut()}
            className="mt-3 w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
