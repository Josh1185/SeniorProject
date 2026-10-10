/**
 * FILE: badRequest.ts
 * DESCRIPTION: Reusable function for returning bad request 400 responses
 *
 * LAST UPDATED: 2026-10-09 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import type { Response } from 'express';

// -------------------- Function --------------------
export default function badRequest(res: Response, message: string) {
  return res.status(400).json({
    error: {
      code: 'BAD_REQUEST',
      message,
    },
  });
}
