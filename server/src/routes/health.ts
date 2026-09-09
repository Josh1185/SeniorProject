/**
 * FILE: health.ts
 * DESCRIPTION: The router for server health endpoints
 * 
 * LAST UPDATED: 2026-09-08 - File Created (Josh Iehle)
 */

// -------------------- Module Imports --------------------
import { Router } from "express";

// -------------------- Router Instance --------------------
export const healthRouter = Router();

// -------------------- Routes --------------------

/**
 * * GET /api/health/
 * responds with server health status
 */
healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});