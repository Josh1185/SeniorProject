/**
 * FILE: forbidden.ts
 * DESCRIPTION: Reusable function for returning not found 403 responses
 *
 * LAST UPDATED: 2026-10-09 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import type { Response } from 'express';

// -------------------- Function --------------------
export default function forbidden(res: Response, message: string) {
  return res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message,
    },
  });
}
