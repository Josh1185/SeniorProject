/**
 * FILE: Avatar.tsx
 * DESCRIPTION: A user's picture, falling back to their initials.
 *
 *              Extracted from ProfileMenu, which had the initials helper and
 *              the circle markup inline and needed both twice in one file. The
 *              trip overview's member list wants the same thing, so this is now
 *              the one place that decides what a user looks like.
 *
 *              PROFILE PICTURE UPLOAD IS NOT IN SCOPE. `avatarUrl` is whatever
 *              the auth provider gave us, which for an email signup is null -
 *              so the initials path is the common case, not the edge case.
 *
 *              It renders only the circle, with no ring, margin or cursor. A
 *              caller that needs the avatar to be clickable wraps it in a
 *              button and puts the interaction styling there, which is what
 *              ProfileMenu does.
 *
 * LAST UPDATED: 2026-10-16 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { getInitials } from '../lib/initials';

// -------------------- Props interface --------------------
interface AvatarProps {
  /** Used for the initials. */
  displayName: string;
  /** Null or undefined falls back to initials. */
  avatarUrl?: string | null;
  /** sm = 32px (lists), md = 36px (header), lg = 64px (profile card). */
  size?: 'sm' | 'md' | 'lg';
}

// -------------------- Size Map --------------------

/**
 * Written out as whole class strings rather than built with a template
 * literal. Tailwind scans source text for complete class names, so `h-${n}`
 * compiles to nothing at all and the avatar renders with no size.
 *
 * A fixed set of three rather than a freeform number, so every avatar in the
 * app is one of three sizes instead of thirty-seven slightly different circles.
 */
const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-16 w-16 text-xl',
} as const;

// -------------------- Component --------------------
export function Avatar({ displayName, avatarUrl, size = 'sm' }: AvatarProps) {
  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-ink-200 font-medium text-ink-700 ${SIZE_CLASSES[size]}`}
    >
      {avatarUrl ? (
        // alt="" because the name is always rendered as text beside or below
        // the avatar. Repeating it here would make a screen reader say it twice.
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{getInitials(displayName)}</span>
      )}
    </div>
  );
}
