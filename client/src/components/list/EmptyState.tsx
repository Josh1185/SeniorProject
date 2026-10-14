/**
 * FILE: EmptyState.tsx
 * DESCRIPTION: What a list shows when it has nothing to show.
 *
 *              Generic, because every feature list needs one. A blank area is
 *              indistinguishable from a broken page.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ReactNode } from 'react';

// -------------------- Prop Interface --------------------
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

// -------------------- Component --------------------
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-ink-300 p-12 text-center">
      <p className="font-medium text-ink-900">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-700">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
