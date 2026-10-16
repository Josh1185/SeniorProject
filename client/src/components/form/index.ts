/**
 * FILE: index.ts
 * DESCRIPTION: Barrel for the form folder, so a form imports one line instead
 *              of four:
 *
 *                import { TextField, TextArea, DateTimeInput } from '../form';
 *
 *              Barrels are used ONLY for leaf folders of small related
 *              components like this one. Do not add a barrel at src/components
 *              or src/hooks - a top-level barrel makes every import pull in
 *              every component in the tree, which wrecks tree-shaking and
 *              creates import cycles that are miserable to unpick.
 *
 * LAST UPDATED: 2026-10-15 - File Created (Josh Iehle)
 */

export { FormField } from './FormField';
export type { FieldRenderProps } from './FormField';
export { TextField } from './TextField';
export { TextArea } from './TextArea';
export { DateTimeInput } from './DateTimeInput';
