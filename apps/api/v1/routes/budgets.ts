import { zCreateBudget, zCreateUser, zUpdateBudget } from '@6pm/validation'
import { zValidator } from '@hono/zod-validator'
import { BudgetUserPermission } from '@prisma/client'
import { Hono } from 'hono'
import { z } from 'zod'
import { getAuthUser, getAuthUserStrict } from '../middlewares/auth'
import {
  canUserDeleteBudgetInvitation,
  canUserGenerateBudgetInvitation,
  canUserInviteUserToBudget,
  deleteBudgetInvitation,
  findBudgetInvitation,
  generateBudgetInvitation,
  inviteUserToBudget,
  respondToBudgetInvitation,
  verifyBudgetInvitationToken,
} from '../services/budget-invitation.service'
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

const zBudgetParamValidator = zValidator(
  'param',
  z.object({
    budgetId: z.string(),
  }),
)

const zInvitationParamValidator = zValidator(
  'param',
  z.object({
    budgetId: z.string(),
    invitationId: z.string(),
  }),
)

const router = new Hono()

  .get(
    '/',
    zValidator(
      'query',
      z.object({
        permission: z.nativeEnum(BudgetUserPermission).optional(),
      }),
    ),
    async (c) => {
      const user = getAuthUserStrict(c)
      const { permission } = c.req.valid('query')

      const budgets = await findBudgetsOfUser({ user, permission })

      return c.json(budgets)
    },
  )

  .post('/', zValidator('json', zCreateBudget), async (c) => {
    const user = getAuthUserStrict(c)

    if (!(await canUserCreateBudget({ user }))) {
      return c.json({ message: 'user cannot create budget' }, 403)
    }

    const createBudgetData = c.req.valid('json')

    const budget = await createBudget({ user, data: createBudgetData })

    return c.json(budget, 201)
  })

  .get('/:budgetId', zBudgetParamValidator, async (c) => {
    const user = getAuthUserStrict(c)
    const { budgetId } = c.req.valid('param')

    const budget = await findBudget({ budgetId })

    if (!(budget && (await canUserReadBudget({ user, budget })))) {
      return c.json({ message: 'budget not found' }, 404)
    }

    return c.json(budget)
  })

  .put(
    '/:budgetId',
    zBudgetParamValidator,
    zValidator('json', zUpdateBudget),
    async (c) => {
      const user = getAuthUserStrict(c)
      const { budgetId } = c.req.valid('param')

      const budget = await findBudget({ budgetId })

      if (!(budget && (await canUserReadBudget({ user, budget })))) {
        return c.json({ message: 'budget not found' }, 404)
      }

      if (!(await canUserUpdateBudget({ user, budget }))) {
        return c.json({ message: 'user cannot update budget' }, 403)
      }

      const updateBudgetData = c.req.valid('json')

      const updatedBudget = await updateBudget({
        budgetId,
        data: updateBudgetData,
      })

      return c.json(updatedBudget)
    },
  )

  .delete('/:budgetId', zBudgetParamValidator, async (c) => {
    const user = getAuthUserStrict(c)
    const { budgetId } = c.req.valid('param')

    const budget = await findBudget({ budgetId })

    if (!(budget && (await canUserReadBudget({ user, budget })))) {
      return c.json({ message: 'budget not found' }, 404)
    }

    if (!(await canUserDeleteBudget({ user, budget }))) {
      return c.json({ message: 'user cannot delete budget' }, 403)
    }

    await deleteBudget({ budgetId })

    return c.json(budget)
  })

  /** Generate sharable invitation link */
  .post('/:budgetId/invitations/generate', zBudgetParamValidator, async (c) => {
    const user = getAuthUserStrict(c)
    const { budgetId } = c.req.valid('param')

    const budget = await findBudget({ budgetId })

    if (!(budget && (await canUserReadBudget({ user, budget })))) {
      return c.json({ message: 'budget not found' }, 404)
    }

    if (!(await canUserGenerateBudgetInvitation({ user, budget }))) {
      return c.json(
        { message: 'user cannot generate invite link to budget' },
        403,
      )
    }

    const invitation = await generateBudgetInvitation({
      budgetId,
      userId: user.id,
    })

    return c.json(invitation)
  })

  /** Invite user to budget by email */
  .post(
    '/:budgetId/invitations',
    zBudgetParamValidator,
    zValidator(
      'json',
      z.object({
        email: z.string().email(),
        permission: z.nativeEnum(BudgetUserPermission).optional(),
      }),
    ),
    async (c) => {
      const user = getAuthUserStrict(c)
      const { budgetId } = c.req.valid('param')

      const budget = await findBudget({ budgetId })

      if (!(budget && (await canUserReadBudget({ user, budget })))) {
        return c.json({ message: 'budget not found' }, 404)
      }

      if (!(await canUserInviteUserToBudget({ user, budget }))) {
        return c.json(
          { message: 'user cannot invite users to this budget' },
          403,
        )
      }

      const { email, permission } = c.req.valid('json')

      const invitation = await inviteUserToBudget({
        inviter: user,
        budget,
        email,
        permission,
      })

      return c.json(invitation, 201)
    },
  )

  /** Delete/revoke invitation */
  .delete(
    '/:budgetId/invitations/:invitationId',
    zInvitationParamValidator,
    async (c) => {
      const user = getAuthUserStrict(c)
      const { budgetId, invitationId } = c.req.valid('param')

      const budget = await findBudget({ budgetId })

      if (!(budget && (await canUserReadBudget({ user, budget })))) {
        return c.json({ message: 'budget not found' }, 404)
      }

      const invitation = await findBudgetInvitation({ invitationId })

      if (!invitation) {
        return c.json({ message: 'invitation not found' }, 404)
      }

      if (!(await canUserDeleteBudgetInvitation({ user, invitation }))) {
        return c.json({ message: 'user cannot delete this invitation' }, 403)
      }

      await deleteBudgetInvitation({ invitationId })

      return c.json(invitation)
    },
  )

  /** Join budget with token */
  .post(
    '/response-invitation',
    zValidator(
      'json',
      z.object({
        token: z.string(),
        userData: zCreateUser.optional(),
        accept: z.boolean(),
      }),
    ),
    async (c) => {
      const user = getAuthUser(c)
      const { token, userData, accept } = c.req.valid('json')

      if (!user && !userData) {
        return c.json({ message: 'user data is required' }, 400)
      }

      const invitation = await verifyBudgetInvitationToken({ token })

      if (!invitation) {
        return c.json(
          {
            message: 'invalid or expired invitation token',
          },
          404,
        )
      }

      const response = await respondToBudgetInvitation({
        invitation,
        accept,
        userData: {
          id: user?.id,
          email: (invitation.email ?? user?.email ?? userData?.email)!,
          name: (user?.name ?? userData?.name)!,
        },
      })

      return c.json(response)
    },
  )

export default router
