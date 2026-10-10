/**
 * FILE: app.ts
 * DESCRIPTION: Builds and returns the Express app without starting a server
 *              This is separated from index.ts so that qa/testing modules can call createApp() for its own server instance
 *
 * LAST UPDATED: 2026-10-10 - Add trip module routes (Josh Iehle)
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

// -------------------- Router Imports --------------------
import { healthRouter } from './routes/health';
import { userRouter } from './routes/userRoutes';
import { tripRouter } from './routes/tripRoutes';

// -------------------- createApp Function --------------------
export function createApp() {
  const app = express();

  // -------------------- Middleware --------------------
  /**
   * Express runs these top to bottom for every request,
   * so security headers land before anything else touches the request,
   * and the body is parse before any routes try to read it
   */

  // Sets a batch of security-related HTTP headers (no config necessary)
  app.use(helmet());

  // Lets the browser call this API from a different origin
  // 'credentials: true' allows cookies/auth headers across origins
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));

  // Parses JSON request bodies into req.body.
  // The limit caps payload size so that someone can't POST a 2GB body and exhaust memory
  app.use(express.json({ limit: '1mb' }));

  // Request logging. Skipped in testing/qa to limit unnecessary output
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  // -------------------- Routers --------------------
  /**
   * Routers for each feature-set in the app
   */

  // Server health checks
  app.use('/api/health', healthRouter);

  // Protected routes (requires auth)
  app.use('/api/users', requireAuth, userRouter);
  app.use('/api/trips', requireAuth, tripRouter);

  // -------------------- 404 Not Found Route Handler --------------------
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // -------------------- 422 ZodError Route Handler (Validation Errors) --------------------
  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      // Validation failures are the caller's fault, not ours. 422 with
      // field-level detail so a form can highlight exactly what to fix.
      if (err instanceof ZodError) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: z.treeifyError(err),
          },
        });
      }

      console.error(err);
      res.status(500).json({ /* ...unchanged... */ });
    },
  );

  // -------------------- 500 Interal Error Route Handler --------------------
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
