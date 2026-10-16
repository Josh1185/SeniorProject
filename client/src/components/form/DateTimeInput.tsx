/**
 * FILE: DateTimeInput.tsx
 * DESCRIPTION: A date or date-and-time input wrapped in FormField chrome.
 *
 *              ONE COMPONENT, TWO MODES:
 *                mode="date"     -> <input type="date">,           emits "YYYY-MM-DD"
 *                mode="datetime" -> <input type="datetime-local">, emits "YYYY-MM-DDTHH:mm"
 *
 *              Trips are date-only, so the trip form uses mode="date".
 *              Activities, reservations and itinerary events are the datetime
 *              callers. Both live here rather than in two components because
 *              the chrome, the min/max pairing and the string contract below
 *              are identical - only the input type differs.
 *
 *              THE STRING CONTRACT - read this before touching dates anywhere:
 *
 *              This component emits exactly what the native input produces and
 *              nothing else. It never builds a Date, never calls toISOString(),
 *              never applies an offset. `new Date("2026-04-20")` is parsed as
 *              UTC midnight while `new Date("2026-04-20T09:00")` is parsed as
 *              LOCAL time - mixing those two is how a date silently lands a day
 *              early for anyone west of UTC.
 *
 *              So the value stays a string all the way to the service layer.
 *              `z.iso.date()` validates "YYYY-MM-DD" on the server and Prisma
 *              stores it. Converting a wall-clock string to an instant is a
 *              deliberate decision made once, in a service - not incidentally
 *              by a form control.
 *
 *              PAIRING TWO FIELDS (start/end): pass the start value as the end
 *              field's `min`. That is a UI courtesy, not the check - the real
 *              ordering rule is in the Zod schema's .refine(), because a native
 *              `min` is trivially bypassed.
 *
 * LAST UPDATED: 2026-10-16 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ComponentProps } from 'react';

// -------------------- Component imports --------------------
import { FormField } from './FormField';
import { controlClasses } from './fieldStyles';

// -------------------- Props interface --------------------
interface DateTimeInputProps extends Omit<ComponentProps<'input'>, 'id' | 'type'> {
  label: string;
  hint?: string;
  error?: string;
  /** Defaults to "date". Use "datetime" only when the time of day matters. */
  mode?: 'date' | 'datetime';
}

// -------------------- Component --------------------
export function DateTimeInput({
  label,
  hint,
  error,
  required,
  mode = 'date',
  className = '',
  ...props
}: DateTimeInputProps) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <input
          {...props}
          id={id}
          type={mode === 'datetime' ? 'datetime-local' : 'date'}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={`${controlClasses(invalid)} ${className}`}
        />
      )}
    </FormField>
  );
}
