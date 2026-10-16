/**
 * FILE: FormField.tsx
 * DESCRIPTION: The label / hint / error chrome that wraps every form control.
 *
 *              It does NOT render an input. It renders everything AROUND one
 *              and hands back the ids the control needs to be accessible:
 *
 *                <FormField label="Trip Name" required>
 *                  {({ id, describedBy, invalid }) => (
 *                    <input id={id} aria-describedby={describedBy}
 *                           aria-invalid={invalid} />
 *                  )}
 *                </FormField>
 *
 *              The render-function shape exists because `aria-describedby` has
 *              to point at ids that FormField generates, and the control is the
 *              thing that carries the attribute. Passing plain children would
 *              mean every caller inventing its own ids and getting it subtly
 *              wrong.
 *
 *              YOU PROBABLY DO NOT USE THIS DIRECTLY. TextField, TextArea and
 *              DateTimeInput wrap it. Reach for FormField when you are wrapping
 *              something custom - LocationPicker does exactly that.
 *
 * LAST UPDATED: 2026-10-15 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ReactNode } from 'react';

// -------------------- Module and lib imports --------------------
import { useId } from 'react';

// -------------------- Types --------------------

/** What FormField hands to the control it wraps. */
export interface FieldRenderProps {
  /** Put this on the control. The <label> already points at it. */
  id: string;
  /**
   * Put this on the control as `aria-describedby`. Undefined when there is
   * no hint and no error, which is the correct value for the attribute -
   * an empty string would announce nothing but still be present.
   */
  describedBy: string | undefined;
  /** Put this on the control as `aria-invalid`. */
  invalid: boolean;
}

interface FormFieldProps {
  label: string;
  /** Shows the required marker AND is not passed to the control - do that yourself. */
  required?: boolean;
  /** Quiet helper text under the label. */
  hint?: string;
  /** Field-level error. Rendered with role="alert" so it is announced. */
  error?: string;
  children: (field: FieldRenderProps) => ReactNode;
}

// -------------------- Component --------------------
export function FormField({ label, required, hint, error, children }: FormFieldProps) {
  // useId is stable across renders and unique per instance, so two of the
  // same field on one page cannot collide.
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  // Space-separated list of every element describing this control, or
  // undefined when there is nothing to describe it.
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="block">
      <label htmlFor={id} className="block text-sm font-medium text-ink-900">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-600">
            *
          </span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="mt-0.5 text-xs text-ink-700">
          {hint}
        </p>
      )}

      <div className="mt-1">{children({ id, describedBy, invalid: Boolean(error) })}</div>

      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
