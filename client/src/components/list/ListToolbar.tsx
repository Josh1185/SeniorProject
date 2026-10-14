/**
 * FILE: ListToolbar.tsx
 * DESCRIPTION: The search / filter / sort / action row above a list.
 *
 *              GENERIC ON PURPOSE. Activities, reservations and expenses all
 *              need the same row with different filter options, so the filter
 *              and sort choices are passed in rather than hardcoded.
 *
 *              The ROWS of a list are not generic - a trip row and an expense
 *              row share no columns - so those stay in each feature's own
 *              component. This toolbar and EmptyState are the parts that
 *              genuinely repeat.
 *
 * LAST UPDATED: 2026-10-13 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ReactNode } from 'react';

// -------------------- Types --------------------

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectControl {
  /** Used as the label and the aria-label, e.g. "Status". */
  name: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

interface ListToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Any number of dropdown filters. Rendered in order. */
  selects?: SelectControl[];
  /** The primary button, e.g. "Create Trip". */
  action?: ReactNode;
}

// -------------------- Component --------------------
export function ListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  selects = [],
  action,
}: ListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* basis-full on mobile pushes the controls onto their own row, so the
          search box is not squeezed to nothing beside two dropdowns. */}
      <input
        type="search"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="min-w-0 basis-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 sm:flex-1 sm:basis-auto bg-ink-100"
      />

      {selects.map((select) => (
        <select
          key={select.name}
          value={select.value}
          onChange={(event) => select.onChange(event.target.value)}
          aria-label={select.name}
          className="cursor-pointer rounded-md border border-ink-300 bg-ink-100 px-3 py-2 text-sm text-ink-900"
        >
          {select.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}

      {/* ml-auto only once the row is wide enough to have spare space. */}
      {action && <div className="sm:ml-auto">{action}</div>}
    </div>
  );
}
