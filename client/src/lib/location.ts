/**
 * FILE: location.ts
 * DESCRIPTION: The shape LocationPicker hands back, shared by every form that
 *              stores a place.
 *
 *              A .ts file, not part of LocationPicker.tsx, because of the
 *              `react-refresh/only-export-components` rule.
 *
 *              FOUR TABLES STORE A PLACE and they name the columns differently,
 *              so the picker returns neutral parts and each form maps them:
 *
 *                Trip          destination      <- label
 *                              destinationAddress <- fullAddress
 *                              latitude, longitude
 *
 *                Activity      locationName     <- a plain TextField, typed
 *                Reservation   locationAddress  <- label
 *                ItineraryEvent latitude, longitude
 *
 *              Note the difference: a trip's destination IS the picked place
 *              ("Orlando, FL"), so the label goes straight into the column. An
 *              activity's name is something a person writes ("Rope drop at
 *              Universal") and only its ADDRESS is geocoded - which is why
 *              those tables have both columns.
 *
 * LAST UPDATED: 2026-10-16 - File Created (Josh Iehle)
 */

// -------------------- Types --------------------

/**
 * A place mid-edit, which is what LocationPicker holds.
 *
 * The coordinates are nullable because typing without picking is allowed -
 * "Grandma's cabin" is a real destination no geocoder has heard of. Anything
 * that needs to map the place checks for them; anything that just needs a
 * label uses `label`.
 */
export interface LocationValue {
  /** What is in the box. A place label, or a formatted address in address mode. */
  label: string;
  /** The longer form, when the geocoder gave one. Null for freehand text. */
  fullAddress: string | null;
  latitude: number | null;
  longitude: number | null;
}

// -------------------- Constants --------------------

/** The starting value for a LocationValue, so forms do not retype it. */
export const emptyLocation: LocationValue = {
  label: '',
  fullAddress: null,
  latitude: null,
  longitude: null,
};
