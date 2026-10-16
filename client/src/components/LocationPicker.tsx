/**
 * FILE: LocationPicker.tsx
 * DESCRIPTION: Place search with Mapbox autocomplete. Type, pick a result, get
 *              a label, a full address and coordinates.
 *
 *              Replaces DestinationInput, which only ever produced a string.
 *              THE ONE WAY THIS APP PICKS A PLACE - activities, reservations
 *              and the itinerary all need it, so it is built once here.
 *
 *              ============================================================
 *              FOR THE ACTIVITY / RESERVATION / ITINERARY SLICES
 *              ============================================================
 *              Your tables have FOUR location columns and they split in two:
 *
 *                locationName     <- a plain TextField. The user types this.
 *                locationAddress  <- this picker, searchFor="address"
 *                latitude         <- this picker
 *                longitude        <- this picker
 *
 *              The name is NOT geocoded. Mapbox's Geocoding API has no
 *              point-of-interest data, so "Universal Studios Florida" is not
 *              findable - but its address is. Hence two controls:
 *
 *                const [place, setPlace] = useState<LocationValue>(emptyLocation);
 *
 *                <TextField label="Activity Name" name="name" required
 *                           defaultValue={state.values.name} />
 *
 *                <LocationPicker
 *                  label="Location"
 *                  searchFor="address"
 *                  value={place}
 *                  onChange={setPlace}
 *                  hint="Optional. Pick a result to pin it on a map later."
 *                />
 *
 *              Then in your submit action:
 *
 *                locationAddress: place.label || undefined,
 *                latitude: place.latitude,
 *                longitude: place.longitude,
 *
 *              A trip is the exception: its destination IS the picked place, so
 *              TripFormModal uses searchFor="destination" and puts the label
 *              straight into `destination`. See that file for the worked
 *              example.
 *              ============================================================
 *
 *              CONTROLLED, because the search writes to it - and it writes
 *              three values at once, not just the text. It renders ONE form
 *              field, the visible input; the other values live in the state you
 *              passed in and your submit action maps them.
 *
 *              FREE TEXT IS ALLOWED. Typing without picking is valid and
 *              leaves the coordinates null. What is NOT allowed is stale
 *              coordinates: editing the text after picking a result CLEARS
 *              them, because "Paris" with Orlando's coordinates is worse than
 *              no coordinates at all.
 *
 *              DEGRADES GRACEFULLY. If VITE_MAPBOX_TOKEN is missing or the API
 *              errors, this stays a working text input. Trip creation must not
 *              depend on a third-party service being up.
 *
 * LAST UPDATED: 2026-10-16 - Rewritten from DestinationInput (Josh Iehle)
 *               2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { KeyboardEvent } from 'react';
import type { LocationValue } from '../lib/location';
import type { PlaceSuggestion, SearchPreset } from '../services/geocodingService';

// -------------------- Module and lib imports --------------------
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { searchPlaces } from '../services/geocodingService';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

// -------------------- Component imports --------------------
import { FormField } from './form/FormField';
import { controlClasses } from './form/fieldStyles';

// -------------------- Props interface --------------------
interface LocationPickerProps {
  label: string;
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  /** 'destination' for a city or country, 'address' for a street address. */
  searchFor?: SearchPreset;
  /** The visible input's field name, if the form reads it from FormData. */
  name?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

// -------------------- Component --------------------
export function LocationPicker({
  label,
  value,
  onChange,
  searchFor = 'destination',
  name,
  required,
  hint,
  error,
  placeholder = 'Start typing to search',
  disabled,
}: LocationPickerProps) {
  // ----- 1. State -----
  // `isOpen` is what separates "the user is typing" from "the text changed
  // because a result was picked". Without it, selecting a result sets the text,
  // which triggers a search for that exact text, which reopens the dropdown
  // underneath the selection the user just made.
  const [isOpen, setIsOpen] = useState(false);

  // Which option the arrow keys are on. -1 is "none", so Enter submits the
  // form rather than selecting an arbitrary first result.
  const [activeIndex, setActiveIndex] = useState(-1);

  // Wraps the input and the list, so "did the click land inside?" is one
  // contains() check.
  const containerRef = useRef<HTMLDivElement>(null);

  // ----- 2. Suggestions -----
  // Waiting for a pause in typing before querying. Without this we would fire
  // a request per keystroke - wasteful, rate-limited, and the results flicker.
  const debouncedValue = useDebouncedValue(value.label, 300);

  const suggestions = useQuery({
    queryKey: ['places', searchFor, debouncedValue],
    // React Query passes an AbortSignal, so a request for "orl" is cancelled
    // when "orla" supersedes it.
    queryFn: ({ signal }) => searchPlaces(debouncedValue, searchFor, signal),
    enabled: isOpen && debouncedValue.trim().length >= 2,
    // Place names do not change. Caching aggressively means retyping the same
    // city costs nothing.
    staleTime: 5 * 60_000,
    // One failed geocode should not retry three times while someone is typing.
    retry: false,
  });

  const results = suggestions.data ?? [];
  const showList = isOpen && debouncedValue.trim().length >= 2;

  // ----- 3. Close on outside click -----
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !containerRef.current?.contains(target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    // Not optional. Without the cleanup every open/close cycle leaves a
    // document listener behind for the life of the page.
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  // ----- 4. Handlers -----

  /** The user typed. The label changes, the coordinates are invalidated. */
  function handleType(text: string) {
    setIsOpen(true);
    setActiveIndex(-1);
    onChange({ label: text, fullAddress: null, latitude: null, longitude: null });
  }

  /** A result was picked. All four values are set together. */
  function handleSelect(place: PlaceSuggestion) {
    setIsOpen(false);
    setActiveIndex(-1);

    onChange({
      label: place.label,
      fullAddress: place.fullAddress,
      latitude: place.latitude,
      longitude: place.longitude,
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Escape closes the list without clearing what they typed.
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!showList || results.length === 0) return;

    if (event.key === 'ArrowDown') {
      // preventDefault stops the caret jumping to the end of the input, which
      // is what ArrowDown normally does in a text field.
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      const place = results[activeIndex];

      // Enter with an option highlighted selects it instead of submitting the
      // form - which is why preventDefault is inside this branch. With nothing
      // highlighted, Enter should still submit.
      if (place) {
        event.preventDefault();
        handleSelect(place);
      }
    }
  }

  // ----- 5. Render -----
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <div ref={containerRef} className="relative">
          <input
            id={id}
            name={name}
            type="text"
            value={value.label}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            // off, because the browser's own address autofill would compete
            // with the geocode dropdown for the same screen space.
            autoComplete="off"
            onChange={(event) => handleType(event.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            // The combobox pattern. Screen readers need all of these to
            // announce the state and to read the highlighted option as the
            // arrow keys move through a list the focus never actually enters.
            role="combobox"
            aria-expanded={showList}
            aria-controls={`${id}-listbox`}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={controlClasses(invalid)}
          />

          {showList && (
            <ul
              id={`${id}-listbox`}
              role="listbox"
              className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-ink-300 bg-ink-50 shadow-lg"
            >
              {suggestions.isLoading && (
                <li className="px-3 py-2 text-sm text-ink-700">Searching…</li>
              )}

              {suggestions.error && (
                <li className="px-3 py-2 text-sm text-ink-700">
                  Place search is unavailable. You can type it in instead.
                </li>
              )}

              {!suggestions.isLoading && !suggestions.error && results.length === 0 && (
                <li className="px-3 py-2 text-sm text-ink-700">
                  No matches. What you typed is still fine - it just will not have coordinates.
                </li>
              )}

              {results.map((place, index) => (
                <li
                  key={place.id}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  // onMouseDown, not onClick: mousedown fires before the input
                  // loses focus, so the selection lands before the outside
                  // click handler can close the list out from under it.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(place);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`cursor-pointer px-3 py-2 duration-150 ${
                    index === activeIndex ? 'bg-ink-200' : 'hover:bg-ink-100'
                  }`}
                >
                  <p className="text-sm text-ink-900">{place.label}</p>
                  {place.fullAddress && place.fullAddress !== place.label && (
                    <p className="truncate text-xs text-ink-700">{place.fullAddress}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </FormField>
  );
}
