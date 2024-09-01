import { zCreateTransaction, zUpdateTransaction } from '@6pm/validation'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { getLogger } from '../../lib/log'
import { getAuthUserStrict } from '../middlewares/auth'
import { generateTransactionDataFromFile } from '../services/ai.service'
import { canUserReadBudget, findBudget } from '../services/budget.service'
import {
  canUserReadCategory,
  findCategoriesOfUser,
  findCategory,
} from '../services/category.service'
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
import { canUserReadWallet, findUserWallet } from '../services/wallet.service'

const zTransactionParamValidator = zValidator(
  'param',
  z.object({
    transactionId: z.string(),
  }),
)

const router = new Hono()

  .get(
    '/',
    zValidator(
      'query',
      z.object({
        wallet_id: z.string().optional(),
        budget_id: z.string().optional(),
        before: z.date({ coerce: true }).optional(),
        after: z.date({ coerce: true }).optional(),
        first: z.number({ coerce: true }).optional(),
        last: z.number({ coerce: true }).optional(),
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
    const logger = getLogger(`${c.req.method} ${c.req.path}`)
    const user = getAuthUserStrict(c)
    const data = c.req.valid('json')
    const { budgetId, walletAccountId: walletId, categoryId } = data

    logger.debug('Creating transaction %o', data)

    const budget = budgetId
      ? await findBudget({ budgetId, anchorDate: data.date })
      : null
    if (budgetId && (!budget || !(await canUserReadBudget({ user, budget })))) {
      logger.error(`Budget not found or user doesn't have read access %o`, {
        budgetId,
        budget,
      })
      return c.json({ message: 'budget not found' }, 404)
    }
    logger.debug('Budget found %o', { budgetId, budget })

    const wallet = await findUserWallet({ user, walletId })
    if (!wallet || !(await canUserReadWallet({ user, walletId }))) {
      logger.error(`Wallet not found or user doesn't have read access %o`, {
        walletId,
        wallet,
      })
      return c.json({ message: 'wallet not found' }, 404)
    }
    logger.debug('Wallet found %o', { walletId, wallet })

    const category =
      (categoryId && (await findCategory({ id: categoryId }))) || null
    if (
      categoryId &&
      (!category || !(await canUserReadCategory({ user, category })))
    ) {
      logger.error(`Category not found or user doesn't have read access %o`, {
        categoryId,
        category,
      })
      return c.json({ message: 'category not found' }, 404)
    }
    logger.debug('Category found %o', { categoryId, category })

    if (
      !(await canUserCreateTransaction({ user, budget, walletAccount: wallet }))
    ) {
      logger.error(`User doesn't have permission to create transaction %o`, {
        user,
        budget,
        wallet,
      })
      return c.json({ message: 'user cannot create transaction' }, 403)
    }

    const createTransactionData = {
      ...data,
      amount:
        (category &&
          (category?.type === 'INCOME'
            ? Math.abs(data.amount)
            : -Math.abs(data.amount))) ||
        data.amount,
    }
    logger.debug('Creating transaction with data %o', createTransactionData)

    const transaction = await createTransaction({
      user,
      data: createTransactionData,
    })

    return c.json(transaction, 201)
  })

  .get('/:transactionId', zTransactionParamValidator, async (c) => {
    const user = getAuthUserStrict(c)
    const { transactionId } = c.req.valid('param')

    const transaction = await findTransaction({ transactionId })

    if (
      !(transaction && (await canUserReadTransaction({ user, transaction })))
    ) {
      return c.json({ message: 'transaction not found' }, 404)
    }

    return c.json(transaction)
  })

  .put(
    '/:transactionId',
    zTransactionParamValidator,
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
      if (
        walletId &&
        (!wallet || !(await canUserReadWallet({ user, walletId })))
      ) {
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

      const categoryId = data.categoryId || transaction.categoryId

      const category =
        (categoryId && (await findCategory({ id: categoryId }))) || null
      if (
        categoryId &&
        (!category || !(await canUserReadCategory({ user, category })))
      ) {
        return c.json({ message: 'category not found' }, 404)
      }

      const transactionAmount =
        data.amount && category
          ? category?.type === 'INCOME'
            ? Math.abs(data.amount)
            : -Math.abs(data.amount)
          : data.amount || transaction.amount

      const updatedTransaction = await updateTransaction({
        transactionId,
        data: {
          ...data,
          amount: transactionAmount as number,
        },
      })

      return c.json(updatedTransaction)
    },
  )

  .delete('/:transactionId', zTransactionParamValidator, async (c) => {
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
  })

  .post('/ai', async (c) => {
    const user = getAuthUserStrict(c)
    const body = await c.req.parseBody()
    const file = body.file as File | undefined

    if (!file) {
      return c.json({ message: 'file not found' }, 400)
    }

    const userCategories = await findCategoriesOfUser({ user })

    try {
      const transactionData = await generateTransactionDataFromFile({
        file,
        categories: userCategories,
      })
      return c.json(transactionData)
    } catch {
      return c.json(
        { message: 'Unable to process the file. Please try again.' },
        500,
      )
    }
  })

export default router
