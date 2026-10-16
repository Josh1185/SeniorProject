/**
 * FILE: ProfileMenu.tsx
 * DESCRIPTION: Avatar button in the header that opens a dropdown with the
 *              signed-in user's name, a larger avatar and a log out button.
 *
 *              Profile editing is out of scope. This is identity + sign out.
 *
 * LAST UPDATED: 2026-10-16 - Use the shared Avatar (Josh Iehle)
 *               2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { SignedInUserResponse } from '../types/api';

// -------------------- Module and lib imports --------------------
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { get } from '../lib/api';
import { useAuth } from '../lib/auth/useAuth';

// -------------------- Component imports --------------------
import { Avatar } from './Avatar';

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
      {/* The button carries the ring and the cursor; Avatar renders only the
          circle. Keeping the interaction styling out here is what lets the
          same Avatar sit in a members list with no hover behaviour at all. */}
      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        // Tells screen readers this button owns a menu and whether it is open.
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="rounded-full duration-150 hover:ring-2 hover:ring-brand-500 cursor-pointer"
      >
        <Avatar displayName={name} avatarUrl={user?.avatarUrl} size="md" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-ink-300 bg-ink-50 p-4 shadow-lg"
        >
          <div className="flex flex-col items-center gap-2 border-b border-ink-300 pb-4">
            <Avatar displayName={name} avatarUrl={user?.avatarUrl} size="lg" />

            <div className="text-center">
              <p className="font-medium text-ink-900">{name || 'Loading…'}</p>
              <p className="text-xs text-ink-700">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            // void: we are deliberately not awaiting. Without it ESLint flags
            // an unhandled floating promise.
            onClick={() => void signOut()}
            className="mt-3 w-full rounded-md px-3 py-2 text-center text-sm text-white bg-brand-600 hover:bg-brand-700 cursor-pointer duration-150"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
