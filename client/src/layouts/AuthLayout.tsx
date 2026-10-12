/**
 * FILE: AuthLayout.tsx
 * DESCRIPTION: The split-screen frame shared by Login and Register: form on
 *              the left, slogan panel on the right.
 *
 *              A plain component rather than a layout ROUTE, because these two
 *              pages sit outside the protected tree and there is nothing to
 *              keep mounted between them.
 *
 * LAST UPDATED: 2026-10-11 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ReactNode } from 'react';

// -------------------- Props interface --------------------
interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** The "Already have an account? Log in" line pinned to the bottom. */
  footer: ReactNode;
}

// -------------------- Component --------------------
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-full">
      {/* ---------- Form side ---------- */}
      <div className="flex w-full flex-col p-6 sm:p-10 lg:w-[42%]">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-slate-500">{subtitle}</p>

          <div className="mt-8 max-w-sm">{children}</div>
        </div>

        {/* mt-auto pushes this to the bottom of the column regardless of how
            tall the form is, which is what keeps Login and Register aligned. */}
        <div className="mt-auto pt-8 text-center text-sm text-slate-500">{footer}</div>
      </div>

      {/* ---------- Slogan side. Hidden on mobile, where it would just be a
           grey block above the fold. ---------- */}
      <div aria-hidden="true" className="hidden flex-1 place-items-center bg-slate-200 lg:grid">
        <p className="px-8 text-center text-2xl text-slate-500">Slogan w/ bg image</p>
      </div>
    </div>
  );
}
