/**
 * FILE: notFound.ts
 * DESCRIPTION: Reusable function for returning not found 404 responses
 *
 * LAST UPDATED: 2026-10-09 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import type { Response } from 'express';

// -------------------- Function --------------------
export default function notFound(res: Response, message: string) {
  return res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message,
    },
  });
}
