import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { getAuthUserStrict } from '../middlewares/auth'
import { canUserReadBudget, findBudget } from '../services/budget.service'
import {
  canUserCreateTransaction,
  createTransaction,
} from '../services/transaction.service'
import { findUserWallet } from '../services/wallet.service'
import {
  zCreateTransaction,
  zUpdateTransaction,
} from '../validation/transaction.zod'

const router = new Hono()

router.get(
  '/',
  zValidator(
    'query',
    z.object({
      order_by: z.enum(['date']).optional(),
      order: z.enum(['asc', 'desc']).optional(),
      wallet_id: z.string().optional(),
      budget_id: z.string().optional(),
      from_date: z.string().optional(),
      to_date: z.string().optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      cursor: z.string().optional(),
    }),
  ),
  async (c) => {
    return c.json([])
  },
)

router.post('/', zValidator('json', zCreateTransaction), async (c) => {
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

router.put(
  '/:transactionId',
  zValidator(
    'param',
    z.object({
      transactionId: z.string(),
    }),
  ),
  zValidator('json', zUpdateTransaction),
  async (c) => {
    return c.json({ message: 'not implemented' })
  },
)

router.delete(
  '/:transactionId',
  zValidator(
    'param',
    z.object({
      transactionId: z.string(),
    }),
  ),
  async (c) => {
    return c.json({ message: 'not implemented' })
  },
)

export default router
