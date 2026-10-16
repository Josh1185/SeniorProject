/**
 * FILE: TextArea.tsx
 * DESCRIPTION: A multi-line input wrapped in FormField chrome.
 *
 *              Extracted from the raw <textarea> that TripFormModal had
 *              inline. Same uncontrolled contract as TextField.
 *
 *              `rows` defaults to 3. Raise it for genuinely long prose; do not
 *              lower it, because a 1-row textarea is a text field with worse
 *              keyboard behaviour.
 *
 *              The optional `maxLength` + `showCount` pair renders a live
 *              character counter. Only turn it on where the limit is tight
 *              enough that someone could realistically hit it - a counter on a
 *              2000-character field is mostly noise, so it is off by default.
 *
 * LAST UPDATED: 2026-10-16 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ComponentProps } from 'react';

// -------------------- Module and lib imports --------------------
import { useState } from 'react';

// -------------------- Component imports --------------------
import { FormField } from './FormField';
import { controlClasses } from './fieldStyles';

// -------------------- Props interface --------------------
interface TextAreaProps extends Omit<ComponentProps<'textarea'>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  /** Render a live "n / max" counter. Requires maxLength. */
  showCount?: boolean;
}

// -------------------- Component --------------------
export function TextArea({
  label,
  hint,
  error,
  required,
  rows = 3,
  showCount,
  maxLength,
  defaultValue,
  onChange,
  className = '',
  ...props
}: TextAreaProps) {
  const counting = Boolean(showCount && maxLength);

  // Only tracked when a counter is actually rendered, so the common case stays
  // uncontrolled and does not re-render per keystroke.
  const [count, setCount] = useState(() => String(defaultValue ?? '').length);

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <>
          <textarea
            {...props}
            id={id}
            rows={rows}
            required={required}
            maxLength={maxLength}
            defaultValue={defaultValue}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={`${controlClasses(invalid)} resize-y ${className}`}
            onChange={(event) => {
              if (counting) setCount(event.target.value.length);

              // Forwarded, not swallowed: a caller may have its own handler and
              // the counter must not be the reason it stops firing.
              onChange?.(event);
            }}
          />

          {counting && (
            <p className="mt-1 text-right text-xs text-ink-700">
              {count} / {maxLength}
            </p>
          )}
        </>
      )}
    </FormField>
  );
}
