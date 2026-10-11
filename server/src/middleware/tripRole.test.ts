/**
 * FILE: tripRole.test.ts
 * DESCRIPTION: Unit tests for the trip-scoped authorization middleware.
 *
 *              Prisma is MOCKED here rather than hitting a real database.
 *              That is deliberate:
 *                - CI runs `npm test` with no Postgres container
 *                - these tests are about the DECISION logic (what status code
 *                  for which role), not about whether Prisma can query
 *
 *              Integration tests against a real database are a separate,
 *              later concern.
 *
 * RUNS WITH: npm test --workspace=server (FROM ROOT DIR OF PROJECT)
 *
 * LAST UPDATED: 2026-10-09 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { NextFunction, Request, Response } from 'express';

// -------------------- Module imports --------------------
import { beforeEach, describe, expect, it, vi } from 'vitest';

// -------------------- Mocks --------------------

/**
 * Replace the real Prisma client with a fake before the middleware imports it.
 *
 * vi.mock is HOISTED to the top of the file by Vitest, so it runs before the
 * import below even though it is written after. This is why the factory cannot
 * reference outside variables - they do not exist yet when it runs.
 */
vi.mock('../lib/prisma', () => ({
  prisma: {
    tripMember: {
      findUnique: vi.fn(),
    },
  },
}));

// Imported AFTER the mock above, so this is the fake.
import { prisma } from '../lib/prisma';
import { requireTripRole } from './tripRole';

// Typed handle on the mock so `.mockResolvedValue()` autocompletes.
const findUnique = vi.mocked(prisma.tripMember.findUnique);

// -------------------- Test Helpers --------------------

const TRIP_ID = '00000000-0000-7000-8000-00000000aaaa';
const USER_ID = '00000000-0000-4000-8000-000000000001';

/**
 * Minimal stand-ins for Express objects. Only the handful of properties the
 * middleware actually touches, cast at the boundary so the tests stay readable.
 */
function createReq(overrides: Partial<Request> = {}) {
  return {
    user: { id: USER_ID, email: 'dev@example.com' },
    params: { tripId: TRIP_ID },
    ...overrides,
  } as unknown as Request;
}

function createRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

type MockRes = ReturnType<typeof createRes>;

/** Pulls the error code out of our standard { error: { code, message } } envelope. */
function errorCode(res: MockRes): string | undefined {
  return (res.body as { error?: { code?: string } } | undefined)?.error?.code;
}

// -------------------- Tests --------------------

describe('requireTripRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----- The happy paths -----

  it('lets a MEMBER through a member-level guard', async () => {
    findUnique.mockResolvedValue({ role: 'MEMBER' } as never);

    const req = createReq();
    const res = createRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireTripRole('MEMBER')(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(0); // nothing was sent
  });

  it('lets an OWNER through a member-level guard', async () => {
    // The whole point of ranking roles rather than comparing them for equality.
    findUnique.mockResolvedValue({ role: 'OWNER' } as never);

    const req = createReq();
    const res = createRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireTripRole('MEMBER')(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('lets an OWNER through an owner-level guard', async () => {
    findUnique.mockResolvedValue({ role: 'OWNER' } as never);

    const req = createReq();
    const res = createRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireTripRole('OWNER')(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('defaults to requiring MEMBER when no role is given', async () => {
    findUnique.mockResolvedValue({ role: 'MEMBER' } as never);

    const req = createReq();
    const res = createRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireTripRole()(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('attaches the resolved role to the request', async () => {
    // Route handlers rely on this to avoid a second membership query.
    findUnique.mockResolvedValue({ role: 'OWNER' } as never);

    const req = createReq();
    const res = createRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireTripRole()(req, res as unknown as Response, next);

    expect(req.tripRole).toBe('OWNER');
  });

  // ----- The refusals -----

  it('returns 404, not 403, for a non-member', async () => {
    // This is the security-relevant case. 403 would confirm the trip exists and
    // let someone walk trip ids to discover real ones.
    findUnique.mockResolvedValue(null);

    const req = createReq();
    const res = createRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireTripRole()(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(404);
    expect(errorCode(res)).toBe('NOT_FOUND');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when a MEMBER hits an OWNER-only guard', async () => {
    // 403 is right here: they already know the trip exists because they are in it.
    findUnique.mockResolvedValue({ role: 'MEMBER' } as never);

    const req = createReq();
    const res = createRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireTripRole('OWNER')(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(403);
    expect(errorCode(res)).toBe('FORBIDDEN');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when requireAuth did not run first', async () => {
    const req = createReq({ user: undefined });
    const res = createRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireTripRole()(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled(); // never reached the database
  });

  it('returns 404 when the route has no :tripId param', async () => {
    // Catches the middleware being mounted on the wrong path.
    const req = createReq({ params: {} as Request['params'] });
    const res = createRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireTripRole()(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(404);
    expect(findUnique).not.toHaveBeenCalled();
  });

  // ----- The query itself -----

  it('scopes the membership lookup to the caller and the trip in the URL', async () => {
    // Guards against a copy-paste bug where the query drops one half of the
    // composite key and starts matching the wrong rows.
    findUnique.mockResolvedValue({ role: 'MEMBER' } as never);

    const req = createReq();
    const res = createRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireTripRole()(req, res as unknown as Response, next);

    expect(findUnique).toHaveBeenCalledWith({
      where: { tripId_userId: { tripId: TRIP_ID, userId: USER_ID } },
      select: { role: true },
    });
  });
});
