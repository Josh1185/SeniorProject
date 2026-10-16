/**
 * FILE: TextArea.tsx
 * DESCRIPTION: A multi-line input wrapped in FormField chrome.
 *
 *              Same uncontrolled-by-default contract as TextField: pass
 *              `defaultValue`, read the value off FormData on submit.
 *
 *              `rows` defaults to 3. Raise it for genuinely long prose; do not
 *              lower it, because a 1-row textarea is a text field with worse
 *              keyboard behaviour.
 *
 *              The optional `maxLength` + `showCount` pair renders a live
 *              character counter under the control. Only turn the counter on
 *              where the server limit is tight enough that a user can realistically
 *              hit it - a counter on a 5000-character field is noise.
 *
 * LAST UPDATED: 2026-10-15 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { TextareaHTMLAttributes } from 'react';

// -------------------- Module and lib imports --------------------
import { useState } from 'react';

// -------------------- Component imports --------------------
import { FormField } from './FormField';

// -------------------- Util imports --------------------
import { controlClasses } from '../../utils/form/controlClasses';

// -------------------- Props interface --------------------
interface TextAreaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'id' | 'className'
> {
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
  ...textareaProps
}: TextAreaProps) {
  // Only tracked when a counter is actually being rendered, so the common
  // case stays uncontrolled and does not re-render per keystroke.
  const [count, setCount] = useState(() => String(defaultValue ?? '').length);

  const counting = Boolean(showCount && maxLength);

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <>
          <textarea
            {...textareaProps}
            id={id}
            rows={rows}
            required={required}
            maxLength={maxLength}
            defaultValue={defaultValue}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={`${controlClasses(invalid)} resize-y`}
            onChange={(e) => {
              if (counting) setCount(e.target.value.length);
              onChange?.(e);
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
