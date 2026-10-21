/**
 * FILE: expenseController.ts
 * DESCRIPTION: Endpoint controllers for the expense module.
 *
 * LAST UPDATED: 2026-10-19 - Add Delete Expense Controller (Josh Iehle)
 *               2026-10-18 - File Created (Josh Iehle)
 */

// -------------------- Type imports --------------------
import type { Request, Response } from 'express';

// -------------------- Module imports --------------------
import { prisma } from '../lib/prisma';

// -------------------- Schema imports --------------------
import { listExpensesQuerySchema, type ListExpensesQuery } from '../schemas/expenseSchemas';

// -------------------- Util imports --------------------
import badRequest from '../utils/badRequest';
import unauthorized from '../utils/unauthorized';
import notFound from '../utils/notFound';

// -------------------- Internal Helpers --------------------

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
  }
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
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
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

  // ----- 4. Search for the expense record in the db using expenseId and tripId -----
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, tripId: tripId },
    select: {
      id: true,
      title: true,
      description: true,
      expenseDate: true,
      amountCents: true,

      // Paid By
      paidBy: {
        select: {
          id: true,
          displayName: true,
        },
      },

      // Associated entities (optional)
      activity: {
        select: {
          id: true,
          name: true,
        },
      },

      reservation: {
        select: {
          id: true,
          name: true,
        },
      },

      // Participants
      participants: {
        select: {
          id: true,
          shareCents: true,
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      },
    },
  });

  // ----- 5. Missing OR out-of-trip expense is a 404 -----
  if (!expense) {
    return notFound(res, 'Expense not found');
  }

  // ----- 6. Respond with formatted expense data -----
  res.json({ expense });
}

// -------------------- DELETE /api/trips/:tripId/expenses/:expenseId --------------------

/**
 * Deletes an expense. NOT mounted behind requireTripRole('OWNER').
 */
export async function deleteExpense(req: Request, res: Response) {
  // ----- 1. Check that the user is mounted to the request -----
  // requireAuth middleware guarantees this, but TypeScript can't know that, so we check
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

  // ----- 4. Delete the expense record -----
  await prisma.expense.delete({
    where: {
      tripId: tripId,
      id: expenseId,
    },
  });

  // ----- 5. Respond with a 204 -----
  res.status(204).end();
}

console.log("hello");
