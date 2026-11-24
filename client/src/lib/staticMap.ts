/**
 * FILE: staticMap.ts
 * DESCRIPTION: URL building for the Mapbox Static Images API, plus the
 *              coordinate guard that decides whether a place can be mapped at
 *              all.
 *
 *              A .ts file, not part of MapView.tsx, for the same reason
 *              location.ts is separate from LocationPicker.tsx - the
 *              `react-refresh/only-export-components` rule - and because these
 *              are pure functions that can be unit tested without rendering
 *              anything. See staticMap.test.ts.
 *
 *              WHY STATIC IMAGES AND NOT MAPBOX GL JS. An interactive GL map
 *              inside a <dialog> has to be measured and sized before
 *              `new mapboxgl.Map()` runs, and a modal that starts hidden
 *              reports a height of zero - so the map renders at 0px and stays
 *              that way until something forces a resize. You also have to call
 *              `map.remove()` on unmount or every row somebody opens leaks a
 *              WebGL context. None of that buys anything in a read-only detail
 *              view. A static image is one <img>, renders instantly, needs no
 *              library, and cannot leak.
 *
 *              THE ACCESS TOKEN IS A PARAMETER, not read from import.meta.env
 *              in this file. That keeps these functions pure - a test can call
 *              them with a fake token and assert on the exact string, which is
 *              the whole point of pulling them out of the component.
 *
 * LAST UPDATED: 2026-11-23 - File Created (Josh Iehle)
 */

// -------------------- Constants --------------------

const STATIC_ENDPOINT = 'https://api.mapbox.com/styles/v1';

/** Mapbox's own street style. `mapbox` is the owner, `streets-v12` the style. */
const STYLE = 'mapbox/streets-v12';

/**
 * The pin colour, as six hex digits with NO leading '#'.
 *
 * This is brand-600 from the Tailwind theme. It is duplicated here as a raw
 * hex string because the value has to travel inside a URL, where a CSS
 * variable cannot go.
 */
const PIN_COLOR = '2563eb';

/**
 * Requested image size in CSS pixels, before the @2x multiplier.
 *
 * Mapbox caps a static image at 1280x1280 actual pixels, and `@2x` doubles
 * whatever is asked for, so anything above 640 here is rejected by the API.
 */
const WIDTH = 600;
const HEIGHT = 300;

/**
 * Default zoom.
 *
 * 14 rather than the 13 in the original task note: every caller here is an
 * address-level place - a restaurant, a hotel, a meeting point - and at 13 the
 * pin sits in an undifferentiated grid of streets. 14 shows the block. A trip
 * destination, if we ever map one, wants about 11.
 */
const DEFAULT_ZOOM = 14;

/**
 * Decimal places kept in the URL.
 *
 * Six is roughly 10cm of precision, which is far more than a pin needs, and
 * truncating there means the URL for a given place is byte-identical on every
 * render. That matters: the browser caches the image by URL, so a stable
 * string is the difference between one Mapbox request per place and one per
 * re-render.
 */
const COORDINATE_PRECISION = 6;

// -------------------- Types --------------------

export interface StaticMapOptions {
  latitude: number;
  longitude: number;
  /** The public Mapbox token. An empty string means "not configured". */
  accessToken: string;
  zoom?: number;
}

// -------------------- Guards --------------------

/**
 * Whether a latitude/longitude pair is something we can actually put a pin on.
 *
 * Both coordinates are nullable on every model - Activity, Reservation and
 * ItineraryEvent all allow a place to be typed without being picked, because
 * "Grandma's cabin" is a real location no geocoder has heard of - so this is
 * checked before a map is rendered rather than assumed.
 *
 * A URL with `undefined` in a coordinate slot comes back from Mapbox as a 422,
 * which in an <img> is a broken-image icon in the middle of a modal.
 *
 * THE 0,0 CASE IS NOT PARANOIA. `searchPlaces` in geocodingService.ts ends
 * with `longitude: props?.coordinates?.longitude ?? 0`, so any geocoder
 * feature that came back without coordinates was stored as exactly 0, 0. That
 * is a point in the Gulf of Guinea, about 1,000 miles off the coast of Ghana,
 * and a map of it looks like a bug in the map rather than a bug in the data.
 * Nobody on this app is planning a trip to Null Island, so the pair is treated
 * as missing. Note that this rejects the PAIR only - latitude 0 alone is
 * Quito, and longitude 0 alone is Greenwich.
 */
export function isPlottableCoordinate(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  if (latitude == null || longitude == null) return false;

  // NaN and Infinity both survive a null check and both produce a 422.
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;

  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;

  if (latitude === 0 && longitude === 0) return false;

  return true;
}

// -------------------- URL Builders --------------------

/**
 * Builds the Static Images API URL for a single pin, centred on itself.
 *
 * Returns null when there is no token or the coordinates are not plottable, so
 * the caller has exactly one thing to check before rendering an <img>.
 *
 * ⚠ LONGITUDE COMES FIRST, TWICE. Mapbox orders coordinates lng,lat - the
 * opposite of the lat,lng order used by Google Maps, by `navigator.geolocation`
 * and by how people say it out loud. It appears in two places in this URL (the
 * pin overlay and the centre) and getting it backwards does not error: it
 * silently puts the pin somewhere else on Earth. Orlando at 28.5,-81.4 becomes
 * a point in Xinjiang.
 *
 * ⚠ THE OVERLAY IS NOT URL-ENCODED, deliberately. `pin-s+2563eb(lng,lat)` uses
 * '+' and parentheses as syntax, and they are legal unencoded in a URL path -
 * '+' only means a space inside a query string. Running this segment through
 * encodeURIComponent turns it into `pin-s%2B2563eb%28...%29` and Mapbox stops
 * recognising the overlay. Only the token, which goes in the query string, is
 * encoded.
 *
 * ⚠ DO NOT ADD `logo=false` OR `attribution=false`. The returned image carries
 * the Mapbox wordmark and attribution baked in, which is how this stays within
 * Mapbox's terms of service. Both parameters require a specific plan and
 * removing attribution without one is a licence violation.
 */
export function buildStaticMapUrl(options: StaticMapOptions): string | null {
  const { latitude, longitude, accessToken, zoom = DEFAULT_ZOOM } = options;

  if (!accessToken) return null;
  if (!isPlottableCoordinate(latitude, longitude)) return null;

  const lng = longitude.toFixed(COORDINATE_PRECISION);
  const lat = latitude.toFixed(COORDINATE_PRECISION);

  const overlay = `pin-s+${PIN_COLOR}(${lng},${lat})`;
  const center = `${lng},${lat},${zoom}`;
  const size = `${WIDTH}x${HEIGHT}@2x`;

  return (
    `${STATIC_ENDPOINT}/${STYLE}/static/${overlay}/${center}/${size}` +
    `?access_token=${encodeURIComponent(accessToken)}`
  );
}

/**
 * A link that opens this point in whatever maps app the reader has.
 *
 * Google's documented `?api=1` form, which opens the Google Maps app on
 * Android and iOS when it is installed and the website otherwise. Apple Maps
 * has its own scheme (maps.apple.com/?ll=) but it is a dead end on Android and
 * on desktop Windows, so one link that works everywhere beats sniffing the
 * platform.
 *
 * COORDINATES, NOT THE ADDRESS TEXT. Handing Google a string to re-geocode can
 * land the reader at a different place with a similar name; a coordinate pair
 * is the same point every time. This is also why the pin above and this link
 * can never disagree.
 */
export function buildDirectionsUrl(latitude: number, longitude: number): string {
  // Query-string context, so encoding IS correct here - the comma becomes %2C.
  const query = encodeURIComponent(`${latitude},${longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
