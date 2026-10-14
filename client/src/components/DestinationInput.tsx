/**
 * FILE: DestinationInput.tsx
 * DESCRIPTION: Destination picker with Mapbox autocomplete.
 *
 *              A combobox, not a plain input: the user types, we query Mapbox
 *              after a short pause, and they pick from a list. Picking stores
 *              the LABEL ("Orlando, FL") - the Trip model has no coordinate
 *              columns, only `destination`.
 *
 *              DEGRADES GRACEFULLY. If VITE_MAPBOX_TOKEN is missing or the API
 *              errors, this stays a working text input. Trip creation must not
 *              depend on a third-party service being up.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { searchPlaces } from '../services/geocodingService';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

// -------------------- Props interface --------------------
interface DestinationInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

// -------------------- Component --------------------
export function DestinationInput({
  label,
  name,
  value,
  onChange,
  required,
  placeholder = 'Select your main destination',
}: DestinationInputProps) {
  // ----- 1. State -----
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Waiting for a pause in typing before querying. Without this we would fire
  // a request per keystroke - wasteful, rate-limited, and the results flicker.
  const debouncedValue = useDebouncedValue(value, 300);

  // ----- 2. Suggestions -----
  const suggestions = useQuery({
    queryKey: ['places', debouncedValue],
    // React Query passes an AbortSignal, so a request for "orl" is cancelled
    // when "orla" supersedes it.
    queryFn: ({ signal }) => searchPlaces(debouncedValue, signal),
    enabled: isOpen && debouncedValue.trim().length >= 2,
    // Place names do not change. Caching aggressively means retyping the same
    // city costs nothing.
    staleTime: 5 * 60_000,
    // One failed geocode should not retry three times while someone is typing.
    retry: false,
  });

  // ----- 3. Close on outside click -----
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !containerRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const results = suggestions.data ?? [];
  const showList = isOpen && debouncedValue.trim().length >= 2;

  // ----- 4. Render -----
  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-ink-900">
        {label}
        <input
          type="text"
          name={name}
          value={value}
          required={required}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            // Escape closes the list without clearing what they typed.
            if (event.key === 'Escape') setIsOpen(false);
          }}
          // Tells screen readers this input owns a popup listbox.
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          className="mt-1 w-full rounded-md border-2 border-ink-300 px-3 py-2 text-ink-900 bg-ink-100"
        />
      </label>

      {showList && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-ink-300 bg-ink-50 shadow-lg"
        >
          {suggestions.isLoading && <li className="px-3 py-2 text-sm text-ink-700">Searching…</li>}

          {suggestions.error && (
            <li className="px-3 py-2 text-sm text-ink-700">
              Place search is unavailable. You can type a destination instead.
            </li>
          )}

          {!suggestions.isLoading && !suggestions.error && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-700">No matches.</li>
          )}

          {results.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                role="option"
                aria-selected={place.label === value}
                // onMouseDown, not onClick: mousedown fires before the input
                // loses focus, so the selection lands before any blur handler
                // can close the list out from under the click.
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(place.label);
                  setIsOpen(false);
                }}
                className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-ink-900 duration-150 hover:bg-ink-100 bg-ink-50"
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
