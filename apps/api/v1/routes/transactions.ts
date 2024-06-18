import {
  zCreateTransaction,
  zUpdateTransaction,
} from '@6pm/validation'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { getAuthUserStrict } from '../middlewares/auth'
import { canUserReadBudget, findBudget } from '../services/budget.service'
import {
  canUserCreateTransaction,
  canUserDeleteTransaction,
  canUserReadTransaction,
  canUserUpdateTransaction,
  createTransaction,
  deleteTransaction,
  findTransaction,
  listTransactions,
  updateTransaction,
} from '../services/transaction.service'
import { findUserWallet } from '../services/wallet.service'

const router = new Hono()

  .get(
    '/',
    zValidator(
      'query',
      z.object({
        wallet_id: z.string().optional(),
        budget_id: z.string().optional(),
        before: z.date().optional(),
        after: z.date().optional(),
        first: z.number().optional(),
        last: z.number().optional(),
      }),
    ),
    async (c) => {
      const user = getAuthUserStrict(c)
      const {
        wallet_id: walletAccountId,
        budget_id: budgetId,
        before,
        after,
        first,
        last,
      } = c.req.valid('query')

      const query: {
        createdByUserId?: string
        budgetId?: string
        walletAccountId?: string
      } = {
        budgetId,
        walletAccountId,
      }

      // If both budget and wallet are not provided, user can only see their own transactions
      if (!budgetId && !walletAccountId) {
        query.createdByUserId = user.id
      }

      // If budget is provided, user must be a member of the budget
      if (budgetId) {
        const budget = await findBudget({ budgetId })
        if (!budget || !(await canUserReadBudget({ user, budget }))) {
          return c.json({ message: 'budget not found' }, 404)
        }
      }

      // If wallet is provided, user must have access to the wallet
      if (walletAccountId) {
        const wallet = await findUserWallet({ user, walletId: walletAccountId })
        if (!wallet) {
          return c.json({ message: 'wallet not found' }, 404)
        }
      }

      return c.json(
        await listTransactions({
          query,
          pagination: { before, after, first, last },
        }),
      )
    },
  )

  .post('/', zValidator('json', zCreateTransaction), async (c) => {
    const user = getAuthUserStrict(c)
    const data = c.req.valid('json')
    const { budgetId, walletAccountId: walletId } = data

    const budget = budgetId ? await findBudget({ budgetId }) : null
    if (budgetId && (!budget || !(await canUserReadBudget({ user, budget })))) {
      return c.json({ message: 'budget not found' }, 404)
    }

    const wallet = await findUserWallet({ user, walletId })
    if (!wallet) {
      return c.json({ message: 'wallet not found' }, 404)
    }

    if (
      !(await canUserCreateTransaction({ user, budget, walletAccount: wallet }))
    ) {
      return c.json({ message: 'user cannot create transaction' }, 403)
    }

    const transaction = await createTransaction({
      user,
      data,
    })

    return c.json(transaction, 201)
  })

  .put(
    '/:transactionId',
    zValidator(
      'param',
      z.object({
        transactionId: z.string(),
      }),
    ),
    zValidator('json', zUpdateTransaction),
    async (c) => {
      const { transactionId } = c.req.valid('param')
      const user = getAuthUserStrict(c)
      const data = c.req.valid('json')
      const { budgetId, walletAccountId: walletId } = data

      const transaction = await findTransaction({ transactionId })

      if (
        !(transaction && (await canUserReadTransaction({ user, transaction })))
      ) {
        return c.json({ message: 'transaction not found' }, 404)
      }

      const wallet = walletId ? await findUserWallet({ user, walletId }) : null
      if (walletId && !wallet) {
        return c.json({ message: 'wallet not found' }, 404)
      }

      if (
        !(await canUserUpdateTransaction({
          user,
          transaction,
          walletAccount: wallet,
        }))
      ) {
        return c.json({ message: 'user cannot update transaction' }, 403)
      }

      const budget = budgetId ? await findBudget({ budgetId }) : null
      if (
        budgetId &&
        (!budget || !(await canUserReadBudget({ user, budget })))
      ) {
        return c.json({ message: 'budget not found' }, 404)
      }

      const updatedTransaction = await updateTransaction({
        transactionId,
        data,
      })

      return c.json(updatedTransaction)
    },
  )

  .delete(
    '/:transactionId',
    zValidator(
      'param',
      z.object({
        transactionId: z.string(),
      }),
    ),
    async (c) => {
      const { transactionId } = c.req.valid('param')
      const user = getAuthUserStrict(c)

      const transaction = await findTransaction({ transactionId })

      if (
        !(transaction && (await canUserReadTransaction({ user, transaction })))
      ) {
        return c.json({ message: 'transaction not found' }, 404)
      }

      if (!(await canUserDeleteTransaction({ user, transaction }))) {
        return c.json({ message: 'user cannot delete transaction' }, 403)
      }

      await deleteTransaction({ transactionId })

      return c.json(transaction)
    },
  )

export default router
