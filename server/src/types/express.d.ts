/**
 * FILE: express.d.ts
 * DESCRIPTION: Express declaration merger
 *
 * LAST UPDATED: 2026-09-24 - File Created (Josh Iehle)
 */

// -------------------- Module Imports --------------------
import 'express';

// -------------------- Type imports --------------------
import type { TripRole } from '../generated/prisma/enums';

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

      /**
       * Set by requireTripRole. Present on any route mounted behind it.
       * Optional because Express types are global - Typescript cannot know
       * which routes have the middleware
       */
      tripRole?: TripRole;
    }
  }
}

export {};
