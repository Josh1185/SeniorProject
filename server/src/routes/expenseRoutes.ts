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

// -------------------- Single Expense Routes --------------------
expenseRouter.get('/:expenseId', getExpenseById);
expenseRouter.patch('/:expenseId', updateExpense);
expenseRouter.delete('/:expenseId', deleteExpense);
