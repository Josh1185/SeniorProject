/**
 * FILE: staticMap.test.ts
 * DESCRIPTION: Unit tests for the Static Images URL builder and the
 *              coordinate guard.
 *
 *              THE ONE THING WORTH TESTING HERE IS COORDINATE ORDER. Mapbox
 *              wants lng,lat and Google Maps wants lat,lng, the two appear in
 *              the same component, and swapping them does not throw - it
 *              silently puts the pin on the other side of the planet. Nothing
 *              in the type system catches that, because both values are
 *              `number`. These tests do.
 *
 *              The property test at the bottom runs the real builder over
 *              random coordinates and reads the numbers back out of the
 *              finished URL, which is a stronger claim than any list of
 *              examples: whatever goes in can be recovered, in the right
 *              order, from both of the two places it appears.
 *
 * LAST UPDATED: 2026-11-23 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { describe, expect, it } from 'vitest';
import {
  buildDirectionsUrl,
  buildStaticMapUrl,
  isPlottableCoordinate,
} from './staticMap';

// -------------------- Helpers --------------------

/** Deterministic PRNG, so a failure is reproducible rather than a one-off. */
function makeRng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/** Pulls the pin and centre coordinates back out of a finished URL. */
const COORDINATES =
  /pin-s\+2563eb\((-?[\d.]+),(-?[\d.]+)\)\/(-?[\d.]+),(-?[\d.]+),(\d+)\//;

// -------------------- isPlottableCoordinate --------------------

describe('isPlottableCoordinate', () => {
  it('accepts a real place', () => {
    expect(isPlottableCoordinate(28.474012, -81.46817)).toBe(true);
  });

  it('rejects a missing coordinate', () => {
    // Nullable on Activity, Reservation and ItineraryEvent alike: typing a
    // place without picking one from the geocoder is allowed.
    expect(isPlottableCoordinate(null, -81.46817)).toBe(false);
    expect(isPlottableCoordinate(28.474012, null)).toBe(false);
    expect(isPlottableCoordinate(undefined, undefined)).toBe(false);
  });

  it('rejects NaN and Infinity, which survive a null check', () => {
    expect(isPlottableCoordinate(NaN, -81)).toBe(false);
    expect(isPlottableCoordinate(28, Infinity)).toBe(false);
  });

  it('rejects coordinates outside the real range', () => {
    expect(isPlottableCoordinate(90.1, 0.5)).toBe(false);
    expect(isPlottableCoordinate(-90.1, 0.5)).toBe(false);
    expect(isPlottableCoordinate(28, 180.5)).toBe(false);
    expect(isPlottableCoordinate(28, -180.5)).toBe(false);
  });

  it('accepts the exact edges of the range', () => {
    expect(isPlottableCoordinate(90, 180)).toBe(true);
    expect(isPlottableCoordinate(-90, -180)).toBe(true);
  });

  it('rejects 0,0, because that is how a failed geocode is stored', () => {
    // searchPlaces ends with `longitude: props?.coordinates?.longitude ?? 0`,
    // so a feature that arrived without coordinates was saved as 0,0 - a
    // point in the Gulf of Guinea that looks like a broken map, not bad data.
    expect(isPlottableCoordinate(0, 0)).toBe(false);
  });

  it('accepts a zero on one axis only', () => {
    // The pair is meaningless; either half alone is a real place.
    expect(isPlottableCoordinate(-0.1807, 0)).toBe(true); // Greenwich
    expect(isPlottableCoordinate(0, -78.4678)).toBe(true); // Quito
  });
});

// -------------------- buildStaticMapUrl --------------------

describe('buildStaticMapUrl', () => {
  it('builds the whole URL for a known place', () => {
    expect(
      buildStaticMapUrl({
        latitude: 28.474012,
        longitude: -81.46817,
        accessToken: 'TOK',
      }),
    ).toBe(
      'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/' +
        'pin-s+2563eb(-81.468170,28.474012)/-81.468170,28.474012,14/600x300@2x' +
        '?access_token=TOK',
    );
  });

  it('puts LONGITUDE first in both coordinate slots', () => {
    // The failure this catches is a pin in Xinjiang instead of Orlando.
    const url = buildStaticMapUrl({
      latitude: 28.474012,
      longitude: -81.46817,
      accessToken: 'TOK',
    });

    const match = COORDINATES.exec(url ?? '');
    expect(match).not.toBeNull();
    expect(Number(match?.[1])).toBe(-81.46817); // pin lng
    expect(Number(match?.[2])).toBe(28.474012); // pin lat
    expect(Number(match?.[3])).toBe(-81.46817); // centre lng
    expect(Number(match?.[4])).toBe(28.474012); // centre lat
  });

  it('leaves the pin syntax unencoded', () => {
    // encodeURIComponent would turn this into pin-s%2B2563eb%28...%29 and
    // Mapbox would stop recognising the overlay.
    const path = (buildStaticMapUrl({
      latitude: 40.7,
      longitude: -74,
      accessToken: 'TOK',
    }) ?? '').split('?')[0];

    expect(path).toContain('pin-s+2563eb(');
    expect(path).not.toContain('%2B');
    expect(path).not.toContain('%28');
  });

  it('encodes the token, which goes in the query string', () => {
    const token = 'pk.eyJfake+token/with=padding';
    const url = buildStaticMapUrl({ latitude: 40.7, longitude: -74, accessToken: token });

    expect(new URL(url ?? '').searchParams.get('access_token')).toBe(token);
    expect(url).toContain('%2B');
  });

  it('returns null rather than a URL with no credentials', () => {
    expect(buildStaticMapUrl({ latitude: 28, longitude: -81, accessToken: '' })).toBeNull();
  });

  it('returns null for coordinates it cannot plot', () => {
    expect(
      buildStaticMapUrl({ latitude: 0, longitude: 0, accessToken: 'TOK' }),
    ).toBeNull();
    expect(
      buildStaticMapUrl({ latitude: NaN, longitude: -81, accessToken: 'TOK' }),
    ).toBeNull();
  });

  it('stays inside the 1280px cap that @2x doubles into', () => {
    const size = /\/(\d+)x(\d+)@(\d)x\?/.exec(
      buildStaticMapUrl({ latitude: 28, longitude: -81, accessToken: 'TOK' }) ?? '',
    );

    expect(Number(size?.[1]) * Number(size?.[3])).toBeLessThanOrEqual(1280);
    expect(Number(size?.[2]) * Number(size?.[3])).toBeLessThanOrEqual(1280);
  });

  it('honours an explicit zoom', () => {
    const url = buildStaticMapUrl({
      latitude: 28,
      longitude: -81,
      accessToken: 'TOK',
      zoom: 11,
    });

    expect(url).toContain(',11/');
  });
});

// -------------------- buildDirectionsUrl --------------------

describe('buildDirectionsUrl', () => {
  it('uses LAT,LNG - the opposite order to Mapbox', () => {
    // Both orders live in the same component. This is the test that stops
    // somebody "fixing" one to match the other.
    const link = buildDirectionsUrl(28.474012, -81.46817);

    expect(new URL(link).searchParams.get('query')).toBe('28.474012,-81.46817');
    expect(new URL(link).searchParams.get('api')).toBe('1');
  });
});

// -------------------- The property that matters --------------------

describe('buildStaticMapUrl, over random coordinates', () => {
  it('round-trips ten thousand coordinate pairs', () => {
    const rng = makeRng(987654321);

    for (let i = 0; i < 10_000; i += 1) {
      const latitude = rng() * 180 - 90;
      const longitude = rng() * 360 - 180;
      if (!isPlottableCoordinate(latitude, longitude)) continue;

      const url = buildStaticMapUrl({ latitude, longitude, accessToken: 'TOK' });
      expect(url).not.toBeNull();

      // ----- 1. It is a URL, and it points at Mapbox -----
      expect(new URL(url ?? '').host).toBe('api.mapbox.com');

      // ----- 2. Both coordinates come back out, in the right order -----
      const match = COORDINATES.exec(url ?? '');
      expect(match).not.toBeNull();
      expect(Math.abs(Number(match?.[1]) - longitude)).toBeLessThan(1e-6);
      expect(Math.abs(Number(match?.[2]) - latitude)).toBeLessThan(1e-6);

      // ----- 3. The pin is at the centre -----
      // If these ever disagree the pin walks off the edge of the image.
      expect(match?.[1]).toBe(match?.[3]);
      expect(match?.[2]).toBe(match?.[4]);

      // ----- 4. No exponent notation -----
      // A coordinate near zero formatted as 1e-7 is a 422 from Mapbox.
      expect(url).not.toContain('e-');

      // ----- 5. The string is deterministic -----
      // The browser caches the image by URL, so an unstable string means a
      // fresh billable request on every re-render.
      expect(buildStaticMapUrl({ latitude, longitude, accessToken: 'TOK' })).toBe(url);
    }
  });
});
