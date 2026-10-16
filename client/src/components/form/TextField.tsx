/**
 * FILE: TextField.tsx
 * DESCRIPTION: A single-line input wrapped in FormField chrome.
 *
 *              UNCONTROLLED BY DEFAULT. Pass `defaultValue` and read the value
 *              from FormData on submit. Note that React 19 resets an
 *              uncontrolled form after a form action runs, so `defaultValue`
 *              should come from the action's returned values - see
 *              lib/formState.ts for why and TripFormModal for the pattern.
 *
 *              Pass `value` + `onChange` only when something OTHER than the
 *              user writes to the field, such as an autocomplete filling it in.
 *
 * LAST UPDATED: 2026-10-16 - Rewritten on FormField (Josh Iehle)
 *               2026-09-26 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ComponentProps } from 'react';

// -------------------- Component imports --------------------
import { FormField } from './FormField';
import { controlClasses } from './fieldStyles';

// -------------------- Props interface --------------------

/**
 * Extends the real input props rather than re-declaring maxLength,
 * placeholder, autoComplete and the rest by hand. `id` is omitted because
 * FormField owns it - accepting one would let a caller break the label link.
 */
interface TextFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

// -------------------- Component --------------------
export function TextField({
  label,
  hint,
  error,
  required,
  className = '',
  ...props
}: TextFieldProps) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <input
          {...props}
          id={id}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={`${controlClasses(invalid)} ${className}`}
        />
      )}
    </FormField>
  );
}
