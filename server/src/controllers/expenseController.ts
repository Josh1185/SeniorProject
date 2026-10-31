/**
 * FILE: expenseController.ts
 * DESCRIPTION: Endpoint controllers for the expense module.
 *
 * LAST UPDATED: 2026-10-20 - Add create and update, fix delete status (Josh Iehle)
 *               2026-10-19 - Add Delete Expense Controller (Josh Iehle)
 *               2026-10-18 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { Request, Response } from 'express';

// -------------------- Module imports --------------------
import { prisma } from '../lib/prisma';

// -------------------- Schema imports --------------------
import {
  listExpensesQuerySchema,
  createExpenseSchema,
  updateExpenseSchema,
  type ListExpensesQuery,
} from '../schemas/expenseSchemas';

// -------------------- Util imports --------------------
import badRequest from '../utils/badRequest';
import unauthorized from '../utils/unauthorized';
import notFound from '../utils/notFound';
import { splitEqually } from '../utils/money';

// -------------------- Shared Selects --------------------

/**
 * The detail shape, defined once.
 *
 * Four endpoints return a single expense - GET one, POST, PATCH, and later
 * anything that re-reads it. Writing the select out four times is how a field
 * ends up on three of them and missing from the fourth, and the client type
 * then lies about one route.
 */
const expenseDetailSelect = {
  id: true,
  title: true,
  description: true,
  expenseDate: true,
  amountCents: true,

  paidBy: {
    select: { id: true, displayName: true },
  },

  // Nullable links, populated only once Sprint 4 wires activities and
  // reservations into expenses. Returned now so the client type is stable.
  activity: {
    select: { id: true, name: true },
  },

  reservation: {
    select: { id: true, name: true },
  },

  participants: {
    select: {
      id: true,
      shareCents: true,
      user: { select: { id: true, displayName: true } },
    },
    // uuid(7) is time-ordered, so this returns participants in the order they
    // were created - which is the order the split produced them in.
    orderBy: { id: 'asc' as const },
  },
};

// -------------------- Internal Helpers --------------------

/**
 * Converts a YYYY-MM-DD string into the Date a @db.Date column expects.
 *
 * `new Date('2026-06-12')` is parsed as UTC midnight by the spec, which is
 * exactly right here. `new Date(2026, 5, 12)` would use LOCAL midnight and
 * shift the stored day for anyone west of Greenwich.
 */
function toDateOnly(isoDate: string): Date {
  return new Date(isoDate);
}

/**
 * Builds the Prisma `orderBy` for a validated sort option.
 */
function buildExpenseOrderBy(sort: ListExpensesQuery['sort'], order: ListExpensesQuery['order']) {
  switch (sort) {
    case 'title':
      return { title: order };
    case 'createdAt':
      return { createdAt: order };
    case 'expenseDate':
      return { expenseDate: order };
    default: {
      // Exhaustiveness check. Add a value to the sort enum without handling it
      // here and this stops compiling. Without it the switch would return
      // undefined, Prisma would read that as "no ordering", and rows would
      // come back in whatever order Postgres felt like - which reads as a
      // frontend bug.
      const unhandled: never = sort;
      throw new Error(`Unhandled expense sort option: ${String(unhandled)}`);
    }
  }
}

/**
 * Returns the ids in `userIds` that are NOT members of this trip.
 *
 * THIS IS A SECURITY CHECK, not a convenience. requireTripRole() proved the
 * CALLER belongs to the trip; it says nothing about the people they just named
 * as payer and participants. Without this, any member could attach a user
 * from another trip - or any user id at all - to an expense, putting a
 * stranger into this trip's balances and exposing their display name through
 * the detail endpoint.
 */
async function findNonMembers(tripId: string, userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];

  const members = await prisma.tripMember.findMany({
    where: { tripId, userId: { in: userIds } },
    select: { userId: true },
  });

  const memberIds = new Set(members.map((member) => member.userId));
  return userIds.filter((id) => !memberIds.has(id));
}

// -------------------- GET /api/trips/:tripId/expenses --------------------

/**
 * Every expense associated with the provided trip, with optional search, filter, and sort.
 */
export async function listExpenses(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve the trip id from the req params -----
  const tripId = req.params.tripId;

  // ----- 3. Validate that the trip ID exists as a string -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 4. Validate the query string -----
  const query = listExpensesQuerySchema.parse(req.query);

  // ----- 5. Search for all expenses associated with -----
  const expenses = await prisma.expense.findMany({
    where: {
      // Make sure the expenses belong to the current trip
      tripId: tripId,

      // SEARCH. Case-insensitive substring for title
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' as const } } : {}),
    },

    orderBy: buildExpenseOrderBy(query.sort, query.order),

    select: {
      id: true,
      expenseDate: true,
      amountCents: true,
      title: true,

      paidBy: {
        select: {
          id: true,
          displayName: true,
        },
      },

      _count: { select: { participants: true } },
    },
  });

  // ----- 6. Flatten the query shape into the response shape -----
  const payload = expenses.map(({ _count, ...expense }) => ({
    ...expense,
    participantCount: _count.participants,
  }));

  // ----- 7. Respond with formatted shape -----
  res.json({ expenses: payload });
}

// -------------------- GET /api/trips/:tripId/expenses/:expenseId --------------------

/**
 * One expense with its full detail
 */
export async function getExpenseById(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve both ids from the req params -----
  const tripId = req.params.tripId;
  const expenseId = req.params.expenseId;

  // ----- 3. Validate that both IDs exist as strings -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  if (typeof expenseId !== 'string') {
    return badRequest(res, 'Missing expense id');
  }

  // ----- 4. Search for the expense record using BOTH ids -----
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, tripId },
    select: expenseDetailSelect,
  });

  // ----- 5. Missing OR out-of-trip expense is a 404 -----
  if (!expense) {
    return notFound(res, 'Expense not found');
  }

  // ----- 6. Respond with formatted expense data -----
  res.json({ expense });
}

// -------------------- POST /api/trips/:tripId/expenses --------------------

/**
 * Creates an expense and its participant shares.
 *
 * The nested `participants: { create: ... }` matters for the same reason the
 * nested members create matters in createTrip: Prisma wraps a nested write and
 * its parent in one transaction. There is no instant at which an expense
 * exists with no shares, so the invariant - shares sum to amountCents - is
 * never observably false, even if the insert fails halfway.
 */
export async function createExpense(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve the trip id from the req params -----
  const tripId = req.params.tripId;

  // ----- 3. Validate that the trip ID exists as a string -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  // ----- 4. Validate and retrieve request body -----
  // Throws a ZodError on invalid input, which the error middleware turns into a 422.
  const body = createExpenseSchema.parse(req.body);

  // ----- 5. Every named user must belong to THIS trip -----
  const named = [...new Set([body.paidById, ...body.participantIds])];
  const outsiders = await findNonMembers(tripId, named);

  if (outsiders.length > 0) {
    return badRequest(res, `Not members of this trip: ${outsiders.join(', ')}`);
  }

  // ----- 6. Compute the split -----
  // The server owns this, not the client. Shares that arrived in a request
  // body could be made not to add up, and nothing downstream would notice
  // until a settlement screen refused to balance.
  const shares = splitEqually(body.amountCents, body.participantIds);

  // ----- 7. Create the expense and its participants atomically -----
  const expense = await prisma.expense.create({
    data: {
      tripId,
      createdById: req.user.id,
      paidById: body.paidById,
      title: body.title,
      description: body.description,
      amountCents: body.amountCents,
      expenseDate: toDateOnly(body.expenseDate),

      participants: {
        create: shares.map((share) => ({
          userId: share.userId,
          shareCents: share.shareCents,
        })),
      },
    },
    select: expenseDetailSelect,
  });

  // ----- 8. Respond with 201 and the created expense -----
  res.status(201).json({ expense });
}

// -------------------- PATCH /api/trips/:tripId/expenses/:expenseId --------------------

/**
 * Partial update. Mounted behind requireTripRole() - any member may edit.
 *
 * PATCH, never PUT: every field is optional and omitted fields are left alone.
 *
 * THE RE-SPLIT IS THE WHOLE POINT OF THIS FUNCTION. Changing the amount
 * without recomputing shares, or changing the participants without
 * recomputing shares, breaks the invariant silently - the row still looks
 * fine, and balances drift by however much the amount moved. So any request
 * touching either one rebuilds the entire participant set.
 */
export async function updateExpense(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve both ids from the req params -----
  const tripId = req.params.tripId;
  const expenseId = req.params.expenseId;

  // ----- 3. Validate that both IDs exist as strings -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  if (typeof expenseId !== 'string') {
    return badRequest(res, 'Missing expense id');
  }

  // ----- 4. Validate and retrieve request body -----
  const body = updateExpenseSchema.parse(req.body);

  // ----- 5. Any user named in THIS request must belong to the trip -----
  // Only the ids actually present are checked. The ones already stored were
  // verified when they were written.
  const named = [
    ...new Set([...(body.paidById ? [body.paidById] : []), ...(body.participantIds ?? [])]),
  ];
  const outsiders = await findNonMembers(tripId, named);

  if (outsiders.length > 0) {
    return badRequest(res, `Not members of this trip: ${outsiders.join(', ')}`);
  }

  // ----- 6. Apply the update, re-splitting if the money or the people moved -----
  //
  // An interactive transaction rather than nested writes, because the order of
  // operations has to be explicit: ExpenseParticipant has
  // @@unique([expenseId, userId]), so creating the new rows before deleting
  // the old ones would collide on anyone present in both sets.
  //
  // The existence check lives INSIDE the transaction so a concurrent delete
  // cannot turn a 404 into a P2025 and therefore a 500.
  const expense = await prisma.$transaction(async (tx) => {
    const current = await tx.expense.findFirst({
      where: { id: expenseId, tripId },
      select: {
        amountCents: true,
        participants: { select: { userId: true }, orderBy: { id: 'asc' } },
      },
    });

    // Signals 404 to the caller below. Returning null is cheaper than
    // throwing and catching a custom error across the transaction boundary.
    if (!current) return null;

    const touchesSplit = body.amountCents !== undefined || body.participantIds !== undefined;

    if (touchesSplit) {
      // Merge against what is stored: a request may change only one of the
      // two, and the split needs both.
      const nextAmount = body.amountCents ?? current.amountCents;
      const nextParticipantIds =
        body.participantIds ?? current.participants.map((participant) => participant.userId);

      const shares = splitEqually(nextAmount, nextParticipantIds);

      await tx.expenseParticipant.deleteMany({ where: { expenseId } });
      await tx.expenseParticipant.createMany({
        data: shares.map((share) => ({
          expenseId,
          userId: share.userId,
          shareCents: share.shareCents,
        })),
      });
    }

    return tx.expense.update({
      where: { id: expenseId },
      data: {
        title: body.title,
        description: body.description,
        amountCents: body.amountCents,
        expenseDate: body.expenseDate ? toDateOnly(body.expenseDate) : undefined,
        paidById: body.paidById,
      },
      select: expenseDetailSelect,
    });
  });

  // ----- 7. Missing OR out-of-trip expense is a 404 -----
  if (!expense) {
    return notFound(res, 'Expense not found');
  }

  // ----- 8. Respond with the updated expense -----
  res.json({ expense });
}

// -------------------- DELETE /api/trips/:tripId/expenses/:expenseId --------------------

/**
 * Deletes an expense. Mounted behind requireTripRole() - any member may delete.
 *
 * ExpenseParticipant cascades from Expense, so the shares go with it and no
 * orphaned rows are left behind to distort balances.
 */
export async function deleteExpense(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  if (!req.user) {
    return unauthorized(res, 'Not signed in');
  }

  // ----- 2. Retrieve both ids from the req params -----
  const tripId = req.params.tripId;
  const expenseId = req.params.expenseId;

  // ----- 3. Validate that both IDs exist as strings -----
  if (typeof tripId !== 'string') {
    return badRequest(res, 'Missing trip id');
  }

  if (typeof expenseId !== 'string') {
    return badRequest(res, 'Missing expense id');
  }

  // ----- 4. Delete the expense record, scoped to this trip -----
  //
  // deleteMany, NOT delete. `delete` throws P2025 when nothing matches, and
  // that reaches the error handler as a 500 - so a deleted-twice request, or
  // an expense id belonging to another trip, would look like a server crash
  // instead of a 404. deleteMany returns a count and throws nothing.
  const result = await prisma.expense.deleteMany({
    where: { id: expenseId, tripId },
  });

  // ----- 5. Nothing deleted means it was missing or not ours -----
  if (result.count === 0) {
    return notFound(res, 'Expense not found');
  }

  // ----- 6. Respond with a 204 -----
  // 204 means No Content: succeeded with nothing to send back
  res.status(204).end();
}
