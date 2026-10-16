/**
 * FILE: geocodingService.ts
 * DESCRIPTION: Place lookup via the Mapbox Geocoding API, used by LocationPicker.
 *
 *              Uses Geocoding **v6** (/search/geocode/v6/forward). v5 still
 *              works but v6 is the current generally-available version and has
 *              a cleaner response shape. Most tutorials you will find online
 *              are still v5 - do not mix them, the response structures differ.
 *
 *              Called from the browser with the public VITE_MAPBOX_TOKEN. That
 *              token is in the JS bundle by design, which is why it MUST have
 *              URL restrictions set in the Mapbox dashboard, and why the
 *              account needs a spend cap - a restriction checks the Referer,
 *              which anything that is not a browser can forge. See
 *              docs/deployment.md.
 *
 *              NO POI SEARCH. Mapbox removed point-of-interest data from
 *              Geocoding v6; named venues live in the separate Search Box API,
 *              which needs session-token handling and a two-step
 *              suggest/retrieve flow. We deliberately do not use it. That is
 *              why SEARCH_PRESETS has no venue mode: an activity's NAME is
 *              typed by the user into a plain TextField, and only its ADDRESS
 *              is geocoded here. The Activity, Reservation and ItineraryEvent
 *              tables split locationName from locationAddress for exactly this
 *              reason.
 *
 * LAST UPDATED: 2026-10-16 - Add address mode and fullAddress (Josh Iehle)
 *               2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Constants --------------------

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const ENDPOINT = 'https://api.mapbox.com/search/geocode/v6/forward';

/**
 * Which feature types each kind of search asks for.
 *
 * This matters more than it looks. Searching a trip destination with the
 * address types surfaces a dozen Orlando Avenues; searching a venue address
 * with the destination types returns the city and nothing useful. The caller
 * picks a preset rather than passing raw type strings, so there are exactly
 * two behaviours in the app instead of one per call site.
 */
const SEARCH_PRESETS = {
  /** A trip destination: a city, state or country. "Orlando, FL" */
  destination: 'place,region,country',
  /** A street address for an activity, reservation or itinerary stop. */
  address: 'address,street,place',
} as const;

export type SearchPreset = keyof typeof SEARCH_PRESETS;

// -------------------- Types --------------------

/**
 * What LocationPicker needs. Deliberately NOT the raw Mapbox feature: the rest
 * of the app should not know or care which geocoder we use, so if we ever swap
 * providers only this file changes.
 */
export interface PlaceSuggestion {
  /** Mapbox's stable id for this place. Used as a React key. */
  id: string;
  /** The short form we show and store, e.g. "Orlando, FL". */
  label: string;
  /** The long form, e.g. "Orlando, Florida, United States". Null when absent. */
  fullAddress: string | null;
  longitude: number;
  latitude: number;
}

/**
 * The slice of the Mapbox v6 response we actually read.
 *
 * Everything optional, because a geocoder returns wildly different shapes for
 * a country, a city, and a street address. Optional chaining below is doing
 * real work, not defensive noise.
 */
interface MapboxFeature {
  properties?: {
    mapbox_id?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
    coordinates?: { longitude?: number; latitude?: number };
    context?: {
      region?: { name?: string; region_code?: string };
      country?: { name?: string };
    };
  };
}

// -------------------- Internal Helpers --------------------

/**
 * Builds a short, human label: "Orlando, FL" rather than
 * "Orlando, Florida, United States".
 *
 * Preference order is deliberate - a US state code is the shortest thing that
 * still disambiguates (there are Portlands in Oregon and Maine), and country
 * name is the fallback for everywhere else.
 */
function toLabel(feature: MapboxFeature): string {
  const props = feature.properties;
  const name = props?.name;
  if (!name) return props?.full_address ?? '';

  const regionCode = props.context?.region?.region_code;
  if (regionCode) return `${name}, ${regionCode}`;

  const countryName = props.context?.country?.name;
  if (countryName) return `${name}, ${countryName}`;

  return props.full_address ?? name;
}

// -------------------- Service Functions --------------------

/**
 * Searches for places matching `query`.
 *
 * `signal` comes from React Query and aborts a request that is no longer
 * wanted, which matters when someone types quickly.
 *
 * In `address` mode the label IS the full address, because a street address
 * has no useful short form - "6000 Universal Blvd" without the city is not
 * something you would store.
 */
export async function searchPlaces(
  query: string,
  preset: SearchPreset = 'destination',
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  // Guard rather than throw: the picker should degrade to a plain text input
  // if nobody has configured a token yet, not crash the create-trip form.
  if (!MAPBOX_TOKEN) {
    console.warn('VITE_MAPBOX_TOKEN is not set. Place search is disabled.');
    return [];
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    access_token: MAPBOX_TOKEN,
    // Prefix matching, which is what makes it feel like autocomplete.
    autocomplete: 'true',
    types: SEARCH_PRESETS[preset],
    limit: '5',
  });

  const response = await fetch(`${ENDPOINT}?${params.toString()}`, { signal });

  if (!response.ok) {
    // Deliberately vague. A geocoder failure should not block trip creation -
    // the caller falls back to letting the user type a destination freehand.
    throw new Error('Could not search for places right now.');
  }

  const data = (await response.json()) as { features?: MapboxFeature[] };

  return (
    (data.features ?? [])
      .map((feature) => {
        const props = feature.properties;
        const full = props?.full_address ?? props?.place_formatted ?? null;

        return {
          id: props?.mapbox_id ?? '',
          // An address's short form is the address itself.
          label: preset === 'address' ? (full ?? toLabel(feature)) : toLabel(feature),
          fullAddress: full,
          longitude: props?.coordinates?.longitude ?? 0,
          latitude: props?.coordinates?.latitude ?? 0,
        };
      })
      // A feature with no id or no label is unusable in a listbox.
      .filter((place) => place.id && place.label)
  );
}
