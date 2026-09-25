/**
 * FILE: userController.ts
 * DESCRIPTION: Endpoint controllers for the user module
 *
 * LAST UPDATED: 2026-09-24 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { Request, Response } from "express";

// -------------------- Util imports --------------------
import unauthorized from "../utils/unauthorized";

// -------------------- Module Imports --------------------
import { prisma } from "../lib/prisma";

export async function getSignedInUserProfile(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Search for the user record in the db using req.user.id -----
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
    }
  });

  // ----- 3. Return the user record or thrown error -----
  res.json({ user });
}
