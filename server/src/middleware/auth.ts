/**
 * FILE: auth.ts
 * DESCRIPTION: Auth middleware for protected routes
 *
 * LAST UPDATED: 2026-09-24 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { NextFunction, Request, Response } from 'express';

// -------------------- Module imports --------------------
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../env';
import { prisma } from '../lib/prisma';

// -------------------- Supabase Handling --------------------

/**
 * Supabase's public keys
 *
 * Created ONCE at module scope, not per request. `createRemoteJWKSet` returns a
 * function that caches the downloaded keys and only refetches when it sees a
 * key id it doesn't recognise (i.e. after a rotation). Building it inside the
 * handler would hit Supabase on every single request.
 */
const JWKS = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

/** The necessary claims from a Supabase token */
interface SupabaseClaims {
  sub: string; // The user's id - this is what we key our User table on
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

// -------------------- Utils --------------------

/** Reusable function for returning unauthorized 401 responses */
function unauthorized(res: Response, message: string) {
  return res.status(401).json({
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
  });
}

// -------------------- requireAuth Middleware --------------------

/**
 * Verifies the caller's token and guarantees a local User row exists
 *
 * * Mount this in front of any route that needs a signed-in user for access
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // ----- 1. Pull the token out of the Authorization header -----
  const header = req.headers.authorization;

  // Verify bearer token exists
  if (!header?.startsWith('Bearer ')) {
    return unauthorized(res, 'Missing bearer token');
  }

  // Verify bearer token is not empty
  const token = header.slice('Bearer '.length).trim();
  if (!token) return unauthorized(res, 'Empty bearer token');

  // ----- 2. Verify the signature and the claims -----
  let claims: SupabaseClaims;
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      // Both of these matter. Without `issuer`, a validly-signed token from a
      // DIFFERENT Supabase project would be accepted. Without `audience`, some
      // non-session tokens would pass.
      issuer: `${env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });
    claims = payload as unknown as SupabaseClaims;
  } catch {
    // Deliberately vague to the client: signature failure, expiry, and wrong
    // issuer all look identical from outside. Log server-side if debugging.
    return unauthorized(res, 'Invalid or expired token');
  }

  // Extract email from claims, and verify it exists
  const email = claims.email;
  if (!email) return unauthorized(res, 'Token has no email claim');

  // ----- 3. Make sure we have a local db row for this person -----
  // Upsert, not create: this runs on EVERY request, so it must be idempotent.
  // First request creates the row; every later one is a cheap no-op update.
  const displayName =
    claims.user_metadata?.full_name ?? claims.user_metadata?.name ?? email.split('@')[0] ?? 'User';

  const user = await prisma.user.upsert({
    where: { id: claims.sub },
    create: {
      id: claims.sub,
      email,
      displayName,
      avatarUrl: claims.user_metadata?.avatar_url ?? null,
    },
    update: { email },
    select: { id: true, email: true },
  });

  // ----- 4. Hand off to the route -----
  req.user = user;
  next();
}
