/**
 * FILE: expenseRoutes.ts
 * DESCRIPTION: The router for expense module endpoints
 *
 * LAST UPDATED: 2026-10-18 - File Created (Josh Iehle)
 */

// -------------------- Module Imports --------------------
import { Router } from 'express';

// -------------------- Controller Imports --------------------
import { listExpenses, getExpenseById } from '../controllers/expenseController';

// -------------------- Router Instance --------------------
export const expenseRouter = Router({ mergeParams: true });

// -------------------- Collection Routes --------------------
expenseRouter.get('/', listExpenses);

// -------------------- Single Expense Routes --------------------
expenseRouter.get('/:expenseId', getExpenseById);
