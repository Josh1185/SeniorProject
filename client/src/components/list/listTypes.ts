/**
 * FILE: listTypes.ts
 * DESCRIPTION: The column contract DataList takes.
 *
 *              A .ts file rather than part of DataList.tsx because of the
 *              `react-refresh/only-export-components` rule.
 *
 * LAST UPDATED: 2026-10-16 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { ReactNode } from 'react';

// -------------------- Column --------------------

/**
 * One column of the desktop table.
 *
 * @template T - the row type, e.g. TripListItem.
 *
 * `cell` is a function rather than a key name on purpose. Half the columns in
 * a real list are not a single field: a title is a Link, dates are two fields
 * run through a formatter, a status is a badge component. A `field: keyof T`
 * API would cover the easy third and force an escape hatch for the rest.
 */
export interface Column<T> {
  /** The <th> text. Also the React key, so keep them unique within a list. */
  header: string;
  cell: (item: T) => ReactNode;
  /**
   * Extra classes for this column's <td>. DataList already applies the cell
   * padding, so this is for things like `text-sm text-ink-700`, an alignment
   * or a width.
   */
  className?: string;
}
