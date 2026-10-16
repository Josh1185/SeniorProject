/**
 * FILE: DateTimeInput.tsx
 * DESCRIPTION: A date or date-and-time input wrapped in FormField chrome.
 *
 *              ONE COMPONENT, TWO MODES:
 *                mode="date"     -> <input type="date">,           emits "YYYY-MM-DD"
 *                mode="datetime" -> <input type="datetime-local">, emits "YYYY-MM-DDTHH:mm"
 *
 *              Trips are date-only, so the trip form uses mode="date". Activities,
 *              reservations and itinerary entries are the datetime callers. Both
 *              modes live here rather than in two components because the label
 *              chrome, the min/max pairing and the string contract below are
 *              identical - only the input type differs.
 *
 *              THE STRING CONTRACT - read this before touching dates anywhere:
 *
 *              This component emits exactly what the native input produces and
 *              nothing else. It never builds a Date, never calls toISOString(),
 *              never applies an offset. A `new Date("2026-04-20")` is parsed as
 *              UTC midnight while `new Date("2026-04-20T09:00")` is parsed as
 *              LOCAL time - mixing those two is how a date silently lands a day
 *              early for anyone west of UTC.
 *
 *              So: the value stays a string from this input all the way to the
 *              service layer. `z.iso.date()` validates "YYYY-MM-DD" on the server
 *              and Prisma stores it as a date. Converting a wall-clock string to
 *              an instant is a SERVICE decision (whose timezone? the traveller's
 *              or the destination's?) and is made there, once, deliberately -
 *              not incidentally by a form control.
 *
 *              PAIRING TWO FIELDS (start/end): pass the start value as the end
 *              field's `min`. That is a UI courtesy, not the check - the real
 *              ordering rule lives in the Zod schema's .refine(), because a
 *              native `min` is trivially bypassed.
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
interface DateTimeInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'className' | 'type'
> {
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
  ...inputProps
}: DateTimeInputProps) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <input
          {...inputProps}
          id={id}
          type={mode === 'datetime' ? 'datetime-local' : 'date'}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={controlClasses(invalid)}
        />
      )}
    </FormField>
  );
}
