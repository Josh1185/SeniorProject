/**
 * FILE: env.ts
 * DESCRIPTION: Environment variable schema
 *
 * LAST UPDATED: 2026-09-08 - File Created (Josh Iehle)
 */

// -------------------- Module Imports --------------------
import { z } from 'zod';

// -------------------- env Schema --------------------
/**
 * Every environment variable this server needs, described once.
 * This is used to prevent issues due to TypeScript's types being erased at runtime
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.url().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),

  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  MAPBOX_TOKEN: z.string().optional(),
  OPENWEATHER_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:\n');
  console.error(z.prettifyError(parsed.error));
  console.error('\nDid you copy server/.env.example to server/.env?');
  process.exit(1);
}

export const env = parsed.data;
