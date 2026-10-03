/**
 * FILE: express.d.ts
 * DESCRIPTION: Express declaration merger
 *
 * LAST UPDATED: 2026-09-24 - File Created (Josh Iehle)
 */

// -------------------- Module Imports --------------------
import 'express';

// -------------------- Declarations --------------------
declare global {
  namespace Express {
    interface Request {
      /**
       * Set by requireAuth. Present on any route mounted behind it.
       * Optional because Express types are global; TypeScript can't know
       * which routes have the middleware, so handlers must still check.
       */
      user?: { id: string; email: string };
    }
  }
}

export {};
