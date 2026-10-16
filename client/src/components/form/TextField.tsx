/**
 * FILE: TextField.tsx
 * DESCRIPTION: A single-line input wrapped in FormField chrome.
 *
 *              UNCONTROLLED BY DEFAULT. Pass `defaultValue` and read the value
 *              from FormData on submit - that is the pattern TripFormModal uses
 *              with useActionState, and it means no state per field and no
 *              re-render per keystroke.
 *
 *              Pass `value` + `onChange` only when something OTHER than the
 *              user writes to the field (an autocomplete picking a suggestion,
 *              a field that mirrors another). LocationPicker needs that;
 *              almost nothing else does.
 *
 * LAST UPDATED: 2026-10-15 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { InputHTMLAttributes } from 'react';

// -------------------- Component imports --------------------
import { FormField } from './FormField';

// -------------------- Util imports --------------------
import { controlClasses } from '../../utils/form/controlClasses';

// -------------------- Props interface --------------------

/**
 * Extends the real input attributes rather than re-declaring maxLength,
 * placeholder, autoComplete and the rest by hand. `id` is omitted because
 * FormField owns it - accepting one would let a caller break the label link.
 */
interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  label: string;
  hint?: string;
  error?: string;
}

// -------------------- Component --------------------
export function TextField({ label, hint, error, required, ...inputProps }: TextFieldProps) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <input
          {...inputProps}
          id={id}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={controlClasses(invalid)}
        />
      )}
    </FormField>
  );
}
