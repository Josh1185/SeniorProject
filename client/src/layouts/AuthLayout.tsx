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

// -------------------- Asset imports --------------------
import heroImage2 from '../assets/hero-image-2.png';

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
    <div className="flex min-h-full bg-ink-50">
      {/* ---------- Form side ---------- */}
      <div className="flex w-full flex-col p-6 sm:p-10 lg:w-1/4 bg-ink-50">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-ink-900">{title}</h1>
          <p className="mt-1 text-ink-700">{subtitle}</p>

          <div className="mt-8 max-w-sm">{children}</div>
        </div>

        {/* mt-auto pushes this to the bottom of the column regardless of how
            tall the form is, which is what keeps Login and Register aligned. */}
        <div className="mt-auto pt-8 text-center text-sm text-ink-700">{footer}</div>
      </div>

      {/* ---------- Slogan side. Hidden on mobile, where it would just be a
           grey block above the fold. ---------- */}
      <div aria-hidden="true" className="relative hidden flex-1 lg:block">
        <img src={heroImage2} alt="" className="absolute inset-0 h-full w-full object-cover" />

        <div className="absolute inset-0 bg-ink-900/25" />
      </div>
    </div>
  );
}
