/**
 * FILE: TextField.tsx
 * DESCRIPTION: Reusable text field component for forms
 *
 * LAST UPDATED: 2026-09-26 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ComponentProps } from 'react';

// -------------------- Props interface --------------------
interface TextFieldProps extends ComponentProps<'input'> {
  label: string;
}

// -------------------- Component --------------------
export function TextField({ label, className = '', ...props }: TextFieldProps) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        {...props}
        className={`mt-1 w-full rounded-md border border-slate-300 px-3 py-2 ${className}`}
      />
    </label>
  );
}
