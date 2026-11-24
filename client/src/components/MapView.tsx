/**
 * FILE: MapView.tsx
 * DESCRIPTION: A map pin for a read-only detail view. One <img> from the
 *              Mapbox Static Images API, plus a link that opens the point in
 *              the reader's own maps app.
 *
 *              DROPPED INTO THE ACTIVITY, RESERVATION AND ITINERARY DETAIL
 *              MODALS, under the address each one already shows. It renders
 *              nothing at all when the place has no coordinates, so a caller
 *              needs no conditional of its own - pass the nullable columns
 *              straight through.
 *
 *              NO MAPBOX GL JS. The reasons are in staticMap.ts; the short
 *              version is that an interactive map inside a <dialog> has to be
 *              measured before it is constructed, a hidden modal measures
 *              zero, and the cleanup it needs leaks a WebGL context every time
 *              it is forgotten. A static image has none of those problems and
 *              a read-only view loses nothing.
 *
 *              THE TRIP OVERVIEW GETS NO MAP. `Trip` stores `destination` as
 *              text and has no coordinate columns, so there is nothing to pin
 *              without a migration. If a trip-level map is ever worth it, the
 *              right one fits all of the trip's activity and reservation pins
 *              in a single view rather than re-geocoding a city name.
 *
 * LAST UPDATED: 2026-11-23 - File Created (Josh Iehle)
 */

// -------------------- React imports --------------------
import { useState } from 'react';

// -------------------- Lib imports --------------------
import {
  buildDirectionsUrl,
  buildStaticMapUrl,
  isPlottableCoordinate,
} from '../lib/staticMap';

// -------------------- Constants --------------------

/**
 * The public token, the same one LocationPicker's geocoding uses.
 *
 * It ships inside the JS bundle - that is what a public token is for - which
 * is why it MUST have URL restrictions set in the Mapbox dashboard and the
 * account must have a spend cap. A static image is a billable request, and an
 * unrestricted token in a public bundle is somebody else's image budget. See
 * docs/deployment.md.
 */
const MAPBOX_TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

// -------------------- Props interface --------------------

interface MapViewProps {
  /** Nullable on every model. Null, undefined or 0,0 renders nothing. */
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  /**
   * What the pin is, for the image's alt text. The place's name if there is
   * one, otherwise its address. Not drawn on the map.
   */
  label?: string | null;
  /** Override the default street-level zoom. Higher is closer. */
  zoom?: number;
  /**
   * Passed through to the wrapper. The detail modals lay their fields out in a
   * two-column grid, so they hand this `sm:col-span-2` to make the map full
   * width.
   */
  className?: string;
}

// -------------------- Component --------------------

export function MapView({ latitude, longitude, label, zoom, className }: MapViewProps) {
  /**
   * The URL that failed to load, rather than a boolean.
   *
   * Storing the URL means the failure clears itself the moment the
   * coordinates change: these modals stay mounted and are reused for every row
   * somebody opens, so a boolean set by one broken image would hide the map
   * for every place opened afterwards. Comparing against the current URL
   * derives the answer instead of having to reset it.
   */
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  // Two steps so TypeScript narrows both values to `number` for the calls
  // below. isPlottableCoordinate also covers NaN, out-of-range and 0,0.
  if (latitude == null || longitude == null) return null;
  if (!isPlottableCoordinate(latitude, longitude)) return null;

  const imageUrl = buildStaticMapUrl({
    latitude,
    longitude,
    accessToken: MAPBOX_TOKEN,
    zoom,
  });

  // Null means no token is configured. The link still works without one, so
  // the component degrades to "Open in Maps" rather than disappearing.
  const showImage = imageUrl !== null && failedUrl !== imageUrl;

  return (
    <figure className={className}>
      {showImage && (
        <img
          src={imageUrl}
          /*
           * A real description, not an empty alt. The address sits directly
           * above this in the modal, so the map is close to decorative - but
           * "map of X" tells a screen reader user what they are skipping,
           * which an empty alt does not.
           */
          alt={label ? `Map showing the location of ${label}` : 'Map of the saved location'}
          /*
           * The requested CSS size. Both attributes are here so the browser
           * reserves the right box before the image arrives and the modal's
           * contents do not jump when it does.
           */
          width={600}
          height={300}
          /*
           * Deliberate, and doing more work than it looks. These modals are
           * mounted while closed, and a closed <dialog> is display:none - an
           * eager image inside one is still fetched, so without this every
           * detail modal on a page would bill a Mapbox request before anybody
           * opened anything.
           *
           * Do NOT add referrerPolicy="no-referrer" here. Mapbox enforces
           * the dashboard's URL restrictions by reading the Referer header, so
           * suppressing it turns every map into a 403 in production while
           * working perfectly on localhost.
           */
          loading="lazy"
          onError={() => setFailedUrl(imageUrl)}
          className="block h-auto w-full rounded-md border border-ink-300 bg-ink-100"
        />
      )}

      <figcaption className="mt-2 flex items-center justify-between gap-3">
        {!showImage && (
          <span className="text-xs text-ink-700">Map preview unavailable.</span>
        )}

        <a
          href={buildDirectionsUrl(latitude, longitude)}
          target="_blank"
          /* noreferrer as well as noopener: this is an outbound link, and the
             trip URL in the Referer is nobody else's business. */
          rel="noreferrer"
          className="ml-auto text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
        >
          Open in Maps
        </a>
      </figcaption>
    </figure>
  );
}
