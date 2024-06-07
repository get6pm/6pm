import { BudgetUserPermissionSchema } from '@/prisma/generated/zod'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { getAuthUserStrict } from '../middlewares/auth'
import {
  canUserCreateBudget,
  canUserDeleteBudget,
  canUserReadBudget,
  canUserUpdateBudget,
  createBudget,
  deleteBudget,
  findBudget,
  findBudgetsOfUser,
  updateBudget,
} from '../services/budget.service'
import { zCreateBudget, zUpdateBudget } from '../validation'

const router = new Hono()

const zBudgetIdParamValidator = zValidator(
  'param',
  z.object({
    budgetId: z.string(),
  }),
)

router.get(
  '/',
  zValidator(
    'query',
    z.object({
      permission: BudgetUserPermissionSchema.optional(),
    }),
  ),
  async (c) => {
    const user = getAuthUserStrict(c)
    const { permission } = c.req.valid('query')

    const budgets = await findBudgetsOfUser({ user, permission })

    return c.json(budgets)
  },
)

router.post('/', zValidator('json', zCreateBudget), async (c) => {
  const user = getAuthUserStrict(c)

  if (!(await canUserCreateBudget({ user }))) {
    return c.json({ message: 'User cannot create budget' }, 403)
  }

  const createBudgetData = c.req.valid('json')

  const budget = await createBudget({ user, data: createBudgetData })

  return c.json(budget, 201)
})

router.get('/:budgetId', zBudgetIdParamValidator, async (c) => {
  const user = getAuthUserStrict(c)
  const { budgetId } = c.req.valid('param')

  const budget = await findBudget({ budgetId })

  if (!(budget && (await canUserReadBudget({ user, budget })))) {
    return c.json(null, 404)
  }

  return c.json(budget)
})

router.put(
  '/:budgetId',
  zBudgetIdParamValidator,
  zValidator('json', zUpdateBudget),
  async (c) => {
    const user = getAuthUserStrict(c)
    const { budgetId } = c.req.valid('param')

    const budget = await findBudget({ budgetId })

    if (!(budget && (await canUserReadBudget({ user, budget })))) {
      return c.json(null, 404)
    }

    if (!(await canUserUpdateBudget({ user, budget }))) {
      return c.json({ message: 'User cannot update budget' }, 403)
    }

    const updateBudgetData = c.req.valid('json')

    const updatedBudget = await updateBudget({
      budgetId,
      data: updateBudgetData,
    })

    return c.json(updatedBudget)
  },
)

router.delete('/:budgetId', zBudgetIdParamValidator, async (c) => {
  const user = getAuthUserStrict(c)
  const { budgetId } = c.req.valid('param')

  const budget = await findBudget({ budgetId })

  if (!(budget && (await canUserReadBudget({ user, budget })))) {
    return c.json(null, 404)
  }

  if (!(await canUserDeleteBudget({ user, budget }))) {
    return c.json({ message: 'User cannot delete budget' }, 403)
  }

  await deleteBudget({ budgetId })

  return c.json(budget)
})

export default router
