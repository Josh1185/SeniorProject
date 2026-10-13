/**
 * FILE: geocodingService.ts
 * DESCRIPTION: Place lookup via the Mapbox Geocoding API, used by the
 *              destination picker.
 *
 *              Uses Geocoding **v6** (/search/geocode/v6/forward). v5 still
 *              works but v6 is the current generally-available version and has
 *              a cleaner response shape. Most tutorials you will find online
 *              are still v5 - do not mix them, the response structures differ.
 *
 *              Called from the browser with the public VITE_MAPBOX_TOKEN. That
 *              token is in the JS bundle by design, which is why it MUST have
 *              URL restrictions set in the Mapbox dashboard. See docs/deployment.md.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Constants --------------------

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const ENDPOINT = 'https://api.mapbox.com/search/geocode/v6/forward';

// -------------------- Types --------------------

/**
 * What the destination picker needs. Deliberately NOT the raw Mapbox feature:
 * the rest of the app should not know or care which geocoder we use, so if we
 * ever swap providers only this file changes.
 */
export interface PlaceSuggestion {
  /** Mapbox's stable id for this place. Used as a React key. */
  id: string;
  /** What we show and store, e.g. "Orlando, FL". */
  label: string;
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
 * Scoped to `types=place,region,country` because this picker chooses a trip
 * DESTINATION - a city or a country, not a street address. Without that
 * filter, typing "Orlando" surfaces a dozen Orlando Avenues.
 *
 * `signal` comes from React Query and aborts a request that is no longer
 * wanted, which matters when someone types quickly.
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  // Guard rather than throw: the picker should degrade to a plain text input
  // if nobody has configured a token yet, not crash the create-trip form.
  if (!MAPBOX_TOKEN) {
    console.warn('VITE_MAPBOX_TOKEN is not set. Destination search is disabled.');
    return [];
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    access_token: MAPBOX_TOKEN,
    // Prefix matching, which is what makes it feel like autocomplete.
    autocomplete: 'true',
    types: 'place,region,country',
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
      .map((feature) => ({
        id: feature.properties?.mapbox_id ?? '',
        label: toLabel(feature),
        longitude: feature.properties?.coordinates?.longitude ?? 0,
        latitude: feature.properties?.coordinates?.latitude ?? 0,
      }))
      // A feature with no id or no label is unusable in a listbox.
      .filter((place) => place.id && place.label)
  );
}
