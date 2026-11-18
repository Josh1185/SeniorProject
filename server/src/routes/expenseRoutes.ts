/**
 * FILE: expenseRoutes.ts
 * DESCRIPTION: The router for expense module endpoints
 *
 * LAST UPDATED: 2026-10-19 - Add Delete Expense Route (Josh Iehle)
 *               2026-10-18 - File Created (Josh Iehle)
 */

// -------------------- Module Imports --------------------
import { Router } from 'express';

// -------------------- Controller Imports --------------------
import {
  listExpenses,
  getTripBalances,
  getExpenseById,
  deleteExpense,
  createExpense,
  updateExpense,
} from '../controllers/expenseController';

// -------------------- Router Instance --------------------
export const expenseRouter = Router({ mergeParams: true });

// -------------------- Collection Routes --------------------
expenseRouter.get('/', listExpenses);
expenseRouter.post('/', createExpense);

// BEFORE '/:expenseId'. Express matches in declaration order, so with
// these the other way round '/balances' is swallowed by the parameter route
// and the controller is handed an expense id of "balances" - a 404 that
// looks like a missing record rather than a routing mistake.
//
// Same trap as '/me' before '/:userId' in memberRoutes.
expenseRouter.get('/balances', getTripBalances);

// -------------------- Single Expense Routes --------------------
expenseRouter.get('/:expenseId', getExpenseById);
expenseRouter.patch('/:expenseId', updateExpense);
expenseRouter.delete('/:expenseId', deleteExpense);
