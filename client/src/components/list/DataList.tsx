
/**
 * FILE: DataList.tsx
 * DESCRIPTION: A list that is a table on desktop and stacked cards on mobile.
 *              Supports optional item selection for detail modals.
 *
 * LAST UPDATED: 2026-11-02 - Added optional item click support.
 */

// -------------------- Type imports --------------------

import type { ReactNode } from 'react';
import type { Column } from './listTypes';

// -------------------- Props interface --------------------

interface DataListProps<T> {
  items: T[];

  /** The React key for a row. Usually `(item) => item.id`. */
  getKey: (item: T) => string;

  /** The desktop table. */
  columns: Column<T>[];

  /** The mobile card's contents. */
  renderCard: (item: T) => ReactNode;

  /** Optional callback when a row or card is clicked. */
  onItemClick?: (item: T) => void;
}

// -------------------- Component --------------------

export function DataList<T>({
  items,
  getKey,
  columns,
  renderCard,
  onItemClick,
}: DataListProps<T>) {
  return (
    <>
      {/* ==================== Desktop: table ==================== */}

      <div className="hidden lg:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-ink-300 text-left">
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className="px-3 py-3 text-xs font-semibold tracking-wide text-brand-600 uppercase"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr
                key={getKey(item)}
                onClick={
                  onItemClick
                    ? () => onItemClick(item)
                    : undefined
                }
                onKeyDown={
                  onItemClick
                    ? (event) => {
                        if (
                          event.key === 'Enter' ||
                          event.key === ' '
                        ) {
                          event.preventDefault();
                          onItemClick(item);
                        }
                      }
                    : undefined
                }
                role={onItemClick ? 'button' : undefined}
                tabIndex={onItemClick ? 0 : undefined}
                className={`border-b border-ink-300 duration-150 hover:bg-ink-100 ${
                  onItemClick
                    ? 'cursor-pointer focus:bg-ink-100'
                    : ''
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={`px-3 py-3 ${column.className ?? ''}`}
                  >
                    {column.cell(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ==================== Mobile: cards ==================== */}

      <ul className="space-y-3 lg:hidden">
        {items.map((item) => (
          <li
            key={getKey(item)}
            onClick={
              onItemClick
                ? () => onItemClick(item)
                : undefined
            }
            onKeyDown={
              onItemClick
                ? (event) => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {
                      event.preventDefault();
                      onItemClick(item);
                    }
                  }
                : undefined
            }
            role={onItemClick ? 'button' : undefined}
            tabIndex={onItemClick ? 0 : undefined}
            className={
              onItemClick
                ? 'cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600'
                : undefined
            }
          >
            {renderCard(item)}
          </li>
        ))}
      </ul>
    </>
  );
}
