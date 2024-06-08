import { dayjsExtended } from '@/lib/dayjs'
import prisma from '@/lib/prisma'
import {
  type Budget,
  BudgetPeriodType,
  BudgetUserPermission,
  type User,
} from '@prisma/client'
import type { CreateBudget, UpdateBudget } from '../validation'
import { inviteUserToBudget } from './budget-invitation.service'

export async function canUserCreateBudget({
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  user,
}: {
  user: User
}): Promise<boolean> {
  return true
}

export async function canUserReadBudget({
  user,
  budget,
}: {
  user: User
  budget: Budget
}): Promise<boolean> {
  return isUserBudgetMember({ user, budget })
}

export async function canUserUpdateBudget({
  user,
  budget,
}: {
  user: User
  budget: Budget
}): Promise<boolean> {
  return isUserBudgetOwner({ user, budget })
}

export async function canUserDeleteBudget({
  user,
  budget,
}: {
  user: User
  budget: Budget
}): Promise<boolean> {
  return isUserBudgetOwner({ user, budget })
}

export async function isUserBudgetMember({
  user,
  budget,
}: {
  user: User
  budget: Budget
}): Promise<boolean> {
  const budgetUser = await prisma.budgetUser.findUnique({
    where: {
      // biome-ignore lint/style/useNamingConvention: <explanation>
      userId_budgetId: {
        userId: user.id,
        budgetId: budget.id,
      },
    },
  })

  return !!budgetUser
}

export async function isUserBudgetOwner({
  user,
  budget,
}: {
  user: User
  budget: Budget
}): Promise<boolean> {
  const budgetUser = await prisma.budgetUser.findUnique({
    where: {
      // biome-ignore lint/style/useNamingConvention: <explanation>
      userId_budgetId: {
        userId: user.id,
        budgetId: budget.id,
      },
      permission: BudgetUserPermission.OWNER,
    },
  })

  return !!budgetUser
}

export async function findBudget({ budgetId }: { budgetId: string }) {
  return prisma.budget.findUnique({
    where: { id: budgetId },
  })
}

/**
 * Given an anchor date and period type,
 * calculate the start and end dates of the budget period.
 * Example:
 * - anchorDate: 2022-01-15
 * - periodType: MONTHLY
 * - startDate: 2022-01-01
 * - endDate: 2022-01-31
 */
function calculateBudgetPeriodStartEndDates({
  anchorDate,
  type,
}: {
  anchorDate: Date
  type: BudgetPeriodType
}) {
  switch (type) {
    case BudgetPeriodType.MONTHLY:
      return {
        startDate: dayjsExtended(anchorDate).startOf('month').toDate(),
        endDate: dayjsExtended(anchorDate).endOf('month').toDate(),
      }
    case BudgetPeriodType.QUARTERLY:
      return {
        startDate: dayjsExtended(anchorDate).startOf('quarter').toDate(),
        endDate: dayjsExtended(anchorDate).endOf('quarter').toDate(),
      }
    case BudgetPeriodType.YEARLY:
      return {
        startDate: dayjsExtended(anchorDate).startOf('year').toDate(),
        endDate: dayjsExtended(anchorDate).endOf('year').toDate(),
      }
    default:
      return {
        startDate: null,
        endDate: null,
      }
  }
}

export async function createBudget({
  user,
  data,
}: {
  user: User
  data: CreateBudget
}) {
  const {
    name,
    type,
    description,
    preferredCurrency,
    period,
    inviteeEmails = [],
  } = data

  const periodConfig = calculateBudgetPeriodStartEndDates({
    anchorDate: new Date(),
    type: period.type,
  })

  const budget = await prisma.budget.create({
    data: {
      name,
      type,
      description,
      preferredCurrency,
      periodConfig: {
        create: {
          type: period.type,
          amount: period.amount,
          startDate: period.startDate ?? periodConfig.startDate,
          endDate: period.endDate ?? periodConfig.endDate,
        },
      },
      budgetUsers: {
        create: {
          userId: user.id,
          permission: BudgetUserPermission.OWNER,
        },
      },
    },
  })

  // Invite users as members
  try {
    await Promise.all(
      inviteeEmails.map((email) =>
        inviteUserToBudget({
          inviter: user,
          budget,
          email,
          permission: BudgetUserPermission.MEMBER,
        }),
      ),
    )
  } catch (error) {
    await deleteBudget({ budgetId: budget.id })
    throw error
  }

  return budget
}

export async function updateBudget({
  budgetId,
  data,
}: {
  budgetId: string
  data: UpdateBudget
}) {
  const { name, description, type, preferredCurrency, period } = data

  const budget = await prisma.budget.update({
    where: { id: budgetId },
    data: {
      name,
      description,
      type,
      preferredCurrency,
      periodConfig: {
        update: {
          type: period?.type,
          amount: period?.amount,
          startDate: period?.startDate,
          endDate: period?.endDate,
        },
      },
    },
  })

  return budget
}

export async function deleteBudget({ budgetId }: { budgetId: string }) {
  await prisma.budget.delete({
    where: { id: budgetId },
  })
}

export async function findBudgetsOfUser({
  user,
  permission,
}: { user: User; permission?: BudgetUserPermission }) {
  return prisma.budget.findMany({
    where: {
      budgetUsers: {
        some: {
          permission: permission ?? undefined,
          userId: user.id,
        },
      },
    },
  })
}

export async function createBudgetUser({
  userId,
  budgetId,
  permission,
}: {
  userId: string
  budgetId: string
  permission: BudgetUserPermission
}) {
  return prisma.budgetUser.create({
    data: {
      userId,
      budgetId,
      permission,
    },
  })
}
