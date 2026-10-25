/**
 * FILE: app.ts
 * DESCRIPTION: Builds and returns the Express app without starting a server
 *              This is separated from index.ts so that qa/testing modules can call createApp() for its own server instance
 *
 * LAST UPDATED: 2026-10-25 - Register member routes before 404 handler
 *               2026-10-18 - Add expense module routes (Josh Iehle)
 *               2026-10-10 - Add trip module routes (Josh Iehle)
 *               2026-09-24 - Add user module routes (Josh Iehle)
 *               2026-09-08 - File Created (Josh Iehle)
 */

// -------------------- Module Imports --------------------
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { ZodError, z } from 'zod';
import { env } from './env';

// -------------------- Middleware imports --------------------
import { requireAuth } from './middleware/auth';
import { requireTripRole } from './middleware/tripRole';

// -------------------- Router Imports --------------------
import { healthRouter } from './routes/health';
import { userRouter } from './routes/userRoutes';
import { tripRouter } from './routes/tripRoutes';
import { activityRouter } from './routes/activityRoutes';
import { expenseRouter } from './routes/expenseRoutes';
import { memberRouter } from './routes/memberRoutes';

// -------------------- createApp Function --------------------
export function createApp() {
  const app = express();

  // -------------------- Middleware --------------------

  // Security headers
  app.use(helmet());

  // Cross-origin requests
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));

  // Parse JSON request bodies
  app.use(express.json({ limit: '1mb' }));

  // Request logging (disabled in tests)
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  // -------------------- Routers --------------------

  // Public health check
  app.use('/api/health', healthRouter);

  // Protected routes
  app.use('/api/users', requireAuth, userRouter);
  app.use('/api/trips', requireAuth, tripRouter);

  app.use('/api/trips/:tripId/activities', requireAuth, requireTripRole(), activityRouter);

  app.use('/api/trips/:tripId/expenses', requireAuth, requireTripRole(), expenseRouter);

  // Members routes must be registered before the 404 handler.
  app.use('/api/trips/:tripId/members', requireAuth, requireTripRole(), memberRouter);

  // -------------------- 404 Not Found Route Handler --------------------
  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  // -------------------- 422 ZodError Route Handler --------------------
  app.use(
    (err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (err instanceof ZodError) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: z.treeifyError(err),
          },
        });
      }

      next(err);
    },
  );

  // -------------------- 500 Internal Error Handler --------------------
  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(err);

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message:
            env.NODE_ENV === 'production'
              ? 'Something went wrong'
              : err instanceof Error
                ? err.message
                : String(err),
        },
      });
    },
  );

  return app;
}
