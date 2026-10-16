/**
 * FILE: geocodeController.ts
 * DESCRIPTION: The Mapbox proxy. Two endpoints, one API key, zero tokens in
 *              the browser.
 *
 *              WHY A PROXY AT ALL. The obvious thing is to put the token in
 *              VITE_MAPBOX_TOKEN and call Mapbox from the client. Anything
 *              VITE_-prefixed is baked into the JS bundle at build time, so
 *              that token is readable by anyone who opens devtools and is
 *              billable to us until it is rotated. Sprint 0 task 9 exists to
 *              stop three features growing three loose API keys; shipping one
 *              key to every browser instead of three to the server is not an
 *              improvement.
 *
 *              What routing through here buys, beyond hiding the key:
 *                - one cache, so a typed search costs one Mapbox call per
 *                  distinct query across all users rather than per keystroke
 *                  per user
 *                - requireAuth, so the quota is spent by our users only
 *                - one response shape, so swapping Mapbox for another provider
 *                  is a change to this file and nothing else
 *
 *              THE RESPONSE SHAPE IS OURS, NOT MAPBOX'S. Mapbox v6 features
 *              are converted to { id, name, address, lat, lng } before leaving
 *              this file. If the client knew about `properties.full_address`
 *              and `geometry.coordinates[0]`, every component touching a
 *              location would be coupled to a vendor's GeoJSON.
 *
 * LAST UPDATED: 2026-10-15 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { Request, Response } from 'express';

// -------------------- Module Imports --------------------
import { env } from '../env';

// -------------------- Schema imports --------------------
import { geocodeSearchQuerySchema, staticMapQuerySchema } from '../schemas/geocodeSchemas';

// -------------------- Constants --------------------

const MAPBOX_GEOCODE_URL = 'https://api.mapbox.com/search/geocode/v6/forward';
const MAPBOX_STATIC_URL = 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static';

/** How long a geocode result is considered fresh. Places do not move. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Hard cap on cache entries, so a scripted client cannot grow it without end. */
const CACHE_MAX_ENTRIES = 500;

// -------------------- Types --------------------

/** One search result, in OUR shape. Mirrored by LocationCandidate on the client. */
interface LocationCandidate {
  id: string;
  /** The short name: "Orlando", "Magic Kingdom Park". */
  name: string;
  /** The full formatted address, or null when Mapbox has no more detail. */
  address: string | null;
  lat: number;
  lng: number;
}

/**
 * The slice of Mapbox's v6 forward-geocode response this file reads.
 *
 * Declared rather than typed as `any` so that a field rename upstream is a
 * compile error here instead of `undefined` arriving in a response. Everything
 * optional, because a feature is not guaranteed to carry any given property.
 */
interface MapboxFeature {
  id?: string;
  properties?: {
    mapbox_id?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
    coordinates?: { latitude?: number; longitude?: number };
  };
  geometry?: { coordinates?: number[] };
}

// -------------------- Geocode Cache --------------------

/**
 * A plain Map with timestamps. Not Redis, deliberately: this is a convenience
 * cache whose worst failure mode is an extra Mapbox call, so a second piece of
 * infrastructure is not worth it. If the API is ever scaled past one instance
 * this becomes a per-instance cache, which is still correct - just less
 * effective.
 */
const geocodeCache = new Map<string, { at: number; results: LocationCandidate[] }>();

function readCache(key: string): LocationCandidate[] | null {
  const hit = geocodeCache.get(key);
  if (!hit) return null;

  if (Date.now() - hit.at > CACHE_TTL_MS) {
    geocodeCache.delete(key);
    return null;
  }

  // Re-insert so that Map's insertion order doubles as a recency order, which
  // is what makes the eviction below least-recently-used rather than arbitrary.
  geocodeCache.delete(key);
  geocodeCache.set(key, hit);

  return hit.results;
}

function writeCache(key: string, results: LocationCandidate[]) {
  geocodeCache.set(key, { at: Date.now(), results });

  while (geocodeCache.size > CACHE_MAX_ENTRIES) {
    // Map iteration starts at the oldest insertion, so the first key is the
    // least recently used. `.value` is possibly undefined to TypeScript even
    // though size > 0 guarantees one exists.
    const oldest = geocodeCache.keys().next().value;
    if (oldest === undefined) break;
    geocodeCache.delete(oldest);
  }
}

// -------------------- Internal Helpers --------------------

/**
 * Turns one Mapbox feature into a LocationCandidate, or null if it is unusable.
 *
 * A result with no coordinates cannot be pinned on a map or stored, so it is
 * dropped rather than passed along with lat/lng of 0 - which is a real place in
 * the Gulf of Guinea and a classic null-island bug.
 */
function toCandidate(feature: MapboxFeature, index: number): LocationCandidate | null {
  const properties = feature.properties;

  // v6 gives coordinates in properties; GeoJSON geometry is the fallback, where
  // the order is [longitude, latitude] - not the other way round.
  const lat = properties?.coordinates?.latitude ?? feature.geometry?.coordinates?.[1];
  const lng = properties?.coordinates?.longitude ?? feature.geometry?.coordinates?.[0];

  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const name = properties?.name?.trim();
  if (!name) return null;

  return {
    // Mapbox ids are stable but not guaranteed present; the index keeps React
    // keys unique either way.
    id: properties?.mapbox_id ?? feature.id ?? `result-${index}`,
    name,
    address: properties?.full_address ?? properties?.place_formatted ?? null,
    lat,
    lng,
  };
}

/** 503 with a message that says what to do, for when the token is not set. */
function mapboxUnavailable(res: Response) {
  return res.status(503).json({
    error: {
      code: 'MAPBOX_UNAVAILABLE',
      message: 'Location search is not configured. Set MAPBOX_TOKEN in the server environment.',
    },
  });
}

// -------------------- GET /api/geocode/search --------------------

/**
 * Forward geocoding: free text in, a short list of places out.
 *
 * Returns `{ results: [...] }` rather than a bare array. An envelope can grow
 * an `attribution` or `provider` field later without breaking every caller,
 * and it matches the `{ trips: [...] }` shape the rest of the API uses.
 */
export async function searchLocations(req: Request, res: Response) {
  // ----- 1. Check the provider is configured -----
  // MAPBOX_TOKEN is optional in env.ts so the app still boots without it. That
  // makes it this controller's job to fail clearly rather than send Mapbox the
  // string "undefined" and relay a 401.
  if (!env.MAPBOX_TOKEN) {
    return mapboxUnavailable(res);
  }

  // ----- 2. Validate the query string -----
  // Throws a ZodError on bad input, which the error middleware turns into a 422.
  const query = geocodeSearchQuerySchema.parse(req.query);

  // ----- 3. Serve from cache when possible -----
  const cacheKey = `${query.q.toLowerCase()}|${query.limit}`;
  const cached = readCache(cacheKey);

  if (cached) {
    return res.json({ results: cached });
  }

  // ----- 4. Ask Mapbox -----
  const url = new URL(MAPBOX_GEOCODE_URL);
  url.searchParams.set('q', query.q);
  url.searchParams.set('limit', String(query.limit));
  url.searchParams.set('access_token', env.MAPBOX_TOKEN);

  const response = await fetch(url);

  // ----- 5. Translate a provider failure into our own -----
  // 502 Bad Gateway, not 500: the request was fine and this server is fine -
  // the upstream dependency is what failed. Mapbox's status code and body are
  // deliberately not forwarded; they would leak the token in an error echo.
  if (!response.ok) {
    console.error(`Mapbox geocode failed: ${response.status} ${response.statusText}`);

    return res.status(502).json({
      error: { code: 'GEOCODE_FAILED', message: 'Location search is unavailable right now.' },
    });
  }

  const body = (await response.json()) as { features?: MapboxFeature[] };

  // ----- 6. Convert to our shape, dropping anything unusable -----
  const results = (body.features ?? [])
    .map(toCandidate)
    .filter((candidate): candidate is LocationCandidate => candidate !== null);

  // ----- 7. Cache and respond -----
  writeCache(cacheKey, results);

  res.json({ results });
}

// -------------------- GET /api/geocode/static --------------------

/**
 * A static map image with a single pin, streamed through this server.
 *
 * WHY AN IMAGE AND NOT mapbox-gl. An interactive map means a browser token, a
 * ~900KB dependency and a WebGL canvas, for a card that shows where one place
 * is. An <img> is one request, needs no token in the client, and prints.
 *
 * When a feature genuinely needs pan, zoom and many markers - the itinerary map
 * is the likely first - add a SECOND component for it rather than making this
 * one interactive. Two components with different costs beats one that always
 * pays the higher price.
 *
 * Note there is no requireAuth exception here: the route sits behind the same
 * guard as everything else, so these images cannot be hotlinked by strangers.
 */
export async function getStaticMap(req: Request, res: Response) {
  // ----- 1. Check the provider is configured -----
  if (!env.MAPBOX_TOKEN) {
    return mapboxUnavailable(res);
  }

  // ----- 2. Validate and clamp the query string -----
  // Every value below is a validated number, which is what makes it safe to
  // interpolate into the URL path on the next line.
  const query = staticMapQuerySchema.parse(req.query);

  // ----- 3. Build the Mapbox URL -----
  // LONGITUDE FIRST. Mapbox's path format is
  // /static/<overlay>/<lon>,<lat>,<zoom>/<width>x<height>, and swapping the
  // pair silently returns a map of somewhere else entirely.
  const overlay = `pin-s+2563eb(${query.lng},${query.lat})`;
  const centre = `${query.lng},${query.lat},${query.zoom}`;
  const size = `${query.width}x${query.height}@2x`;

  const url = new URL(`${MAPBOX_STATIC_URL}/${overlay}/${centre}/${size}`);
  url.searchParams.set('access_token', env.MAPBOX_TOKEN);

  const response = await fetch(url);

  if (!response.ok) {
    console.error(`Mapbox static map failed: ${response.status} ${response.statusText}`);

    return res.status(502).json({
      error: { code: 'STATIC_MAP_FAILED', message: 'Map image is unavailable right now.' },
    });
  }

  // ----- 4. Relay the image bytes -----
  const buffer = Buffer.from(await response.arrayBuffer());

  // Cached hard by the browser. The same coordinates always produce the same
  // image, so a day of caching turns a revisit into zero Mapbox calls.
  res.setHeader('Content-Type', response.headers.get('content-type') ?? 'image/png');
  res.setHeader('Cache-Control', 'private, max-age=86400');

  res.send(buffer);
}
