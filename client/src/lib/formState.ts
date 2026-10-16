/**
 * FILE: formState.ts
 * DESCRIPTION: The shape every useActionState form in this app returns.
 *
 *              WHY THIS EXISTS - the bug it fixes:
 *
 *              React 19 calls form.reset() automatically after a function
 *              passed to <form action={...}> finishes. It does that whether the
 *              action succeeded or not, because React has no idea that
 *              returning a string means "this failed". So a validation error
 *              used to clear every field the user had filled in.
 *
 *              THE FIX, which is the one the React team recommends: the action
 *              returns the values it was given, and every input reads its
 *              `defaultValue` from that returned state. The reset still
 *              happens, but it now restores each input to a default that holds
 *              what the user typed, so nothing is lost.
 *
 *              The same object carries the errors, which is the other half of
 *              the win: `fieldErrors` feeds straight into each control's
 *              `error` prop, so a message lands under the field it belongs to
 *              instead of in one generic line at the bottom of the form.
 *
 *              USAGE:
 *
 *                interface Values { name: string; startDate: string }
 *
 *                const [state, submitAction, isPending] = useActionState(
 *                  async (_prev: FormState<Values>, formData: FormData) => {
 *                    const values = readValues(formData);
 *
 *                    if (somethingWrong) {
 *                      return { values, fieldErrors: { name: 'Too short' } };
 *                    }
 *
 *                    try {
 *                      await save(values);
 *                      return { values };
 *                    } catch (error) {
 *                      return { values, formError: messageOf(error) };
 *                    }
 *                  },
 *                  { values: initialValues },
 *                );
 *
 *                <TextField name="name" defaultValue={state.values.name}
 *                           error={state.fieldErrors?.name} />
 *
 *              ALWAYS RETURN `values`, including on success. An action that
 *              returns a bare error string puts the bug straight back.
 *
 * LAST UPDATED: 2026-10-16 - File Created (Josh Iehle)
 */

// -------------------- Types --------------------

/**
 * @template TValues - the form's fields, as a flat object of strings.
 *
 * Flat and all-strings because that is what FormData gives you. Parse into
 * richer types at the edge, in the submit action, not here.
 */
export interface FormState<TValues extends Record<string, string>> {
  /** What was submitted. Feeds every input's defaultValue. */
  values: TValues;
  /** A message about the whole form - a failed request, usually. */
  formError?: string;
  /**
   * Messages keyed by field name. Feeds each control's `error` prop.
   *
   * Keyed by plain `string`, not by `keyof TValues`, because a field can have
   * an error without its value being carried across the submit - a password
   * confirmation is the obvious case. Tying the two together would force
   * passwords into `values` just to be able to report a mismatch.
   *
   * The trade-off is that a typo'd key compiles. It is a thin loss: these keys
   * match the `name=` attributes on the controls, and TypeScript cannot check
   * those either way.
   */
  fieldErrors?: Record<string, string | undefined>;
}

// -------------------- Helpers --------------------

/**
 * Reads a set of named fields off a FormData as trimmed strings.
 *
 * `formData.get` returns `FormDataEntryValue | null` - a File for a file input,
 * null for a name that is not there - so every read needs the same String()
 * and ?? dance. Doing it once here keeps submit actions readable.
 *
 * Note it TRIMS. A name of "   " should fail the same validation as "", and
 * leaving the trim to each caller is how one form ends up storing padded
 * values that look identical to unpadded ones in the UI.
 */
export function readFormValues<TKey extends string>(
  formData: FormData,
  keys: readonly TKey[],
): Record<TKey, string> {
  const values = {} as Record<TKey, string>;

  for (const key of keys) {
    values[key] = String(formData.get(key) ?? '').trim();
  }

  return values;
}
