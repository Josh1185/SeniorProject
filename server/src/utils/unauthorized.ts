/**
 * FILE: unauthorized.ts
 * DESCRIPTION: Reusable function for returning unauthorized 401 responses
 *
 * LAST UPDATED: 2026-09-24 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import type { Response } from 'express';

// -------------------- Function --------------------
export default function unauthorized(res: Response, message: string) {
  return res.status(401).json({
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
  });
}
