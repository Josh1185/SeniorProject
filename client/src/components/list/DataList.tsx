/**
 * FILE: DataList.tsx
 * DESCRIPTION: A list that is a table on desktop and stacked cards on mobile.
 *
 *              BOTH are rendered and one is hidden with CSS, rather than
 *              measuring the viewport in JavaScript. That means no layout shift
 *              on load, no resize listener, and it works before hydration. The
 *              cost is duplicated DOM for a few dozen rows, which is nothing.
 *
 *              THE DESIGN DECISION, because it is not obvious: the table is
 *              generalised, the card is NOT.
 *
 *              A table is genuinely uniform - a header, then one cell per
 *              column per row - so `columns` describes it completely. Cards are
 *              not. A trip card is a title block on the left with badges
 *              stacked on the right; an expense card wants the amount large and
 *              the payer small; a reservation card leads with a date. Driving
 *              both from one descriptor would mean every card compromising
 *              toward a shape that suits none of them.
 *
 *              So `renderCard` stays a callback. The duplication between the
 *              columns and the card is real, and it is the right trade: each
 *              list says its fields twice and gets a layout that actually fits,
 *              instead of saying them once and fighting the abstraction.
 *
 *              USAGE - see dashboard/TripList.tsx for the worked example:
 *
 *                <DataList
 *                  items={trips}
 *                  getKey={(trip) => trip.id}
 *                  columns={TRIP_COLUMNS}
 *                  renderCard={(trip) => <TripCard trip={trip} />}
 *                />
 *
 *              NOT IN HERE: loading, error and empty states. Those live in the
 *              page, because the words differ per feature - "No trips yet" and
 *              "no trips match those filters" need different copy and different
 *              buttons. DataList assumes it has rows to render.
 *
 * LAST UPDATED: 2026-10-16 - File Created (Josh Iehle)
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
  /**
   * The mobile card's contents. DataList provides the <ul> and <li>, so this
   * returns what goes inside one card - commonly a <Link> wrapping the whole
   * thing.
   */
  renderCard: (item: T) => ReactNode;
}

// -------------------- Component --------------------
export function DataList<T>({ items, getKey, columns, renderCard }: DataListProps<T>) {
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
                className="border-b border-ink-300 duration-150 hover:bg-ink-100"
              >
                {columns.map((column) => (
                  <td key={column.header} className={`px-3 py-3 ${column.className ?? ''}`}>
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
          <li key={getKey(item)}>{renderCard(item)}</li>
        ))}
      </ul>
    </>
  );
}
