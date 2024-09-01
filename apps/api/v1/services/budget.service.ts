import { calculateBudgetPeriodStartEndDates } from '@6pm/utilities'
import type { CreateBudget, UpdateBudget } from '@6pm/validation'
import {
  type Budget,
  type BudgetPeriodConfig,
  BudgetUserPermission,
  type Prisma,
  type User,
} from '@prisma/client'
import prisma from '../../lib/prisma'
import { inviteUserToBudget } from './budget-invitation.service'

const BUDGET_INCLUDE: Prisma.BudgetInclude = {
  periodConfigs: true,
}

type BudgetPopulated = Budget & {
  periodConfigs: BudgetPeriodConfig[]
}

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

export async function findBudget({
  budgetId,
  anchorDate,
}: { budgetId: string; anchorDate?: Date }) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: BUDGET_INCLUDE,
  })

  if (!budget) {
    return null
  }

  return verifyBudgetPeriods({ budget, anchorDate })
}

export async function createBudget({
  user,
  data,
}: {
  user: User
  data: CreateBudget
}) {
  const {
    id,
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
      id,
      name,
      type,
      description,
      preferredCurrency,
      periodConfigs: {
        create: {
          id: period.id,
          type: period.type,
          amount: period.amount ?? 0,
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
    include: BUDGET_INCLUDE,
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

  return verifyBudgetPeriods({ budget })
}

export async function updateBudget({
  budgetId,
  data,
}: {
  budgetId: string
  data: UpdateBudget
}) {
  const { name, description, type, preferredCurrency, period } = data

  const latestPeriodConfig = await findBudgetLatestPeriodConfig({ budgetId })

  const budget = await prisma.budget.update({
    where: { id: budgetId },
    data: {
      name,
      description,
      type,
      preferredCurrency,
      periodConfigs: {
        update: {
          where: {
            id: latestPeriodConfig?.id,
          },
          data: {
            type: period?.type,
            amount: period?.amount,
            startDate: period?.startDate,
            endDate: period?.endDate,
          },
        },
      },
    },
    include: BUDGET_INCLUDE,
  })

  if (!budget) {
    return null
  }

  return verifyBudgetPeriods({ budget })
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
  const budgets = await prisma.budget.findMany({
    where: {
      budgetUsers: {
        some: {
          permission: permission ?? undefined,
          userId: user.id,
        },
      },
    },
    include: BUDGET_INCLUDE,
  })

  return Promise.all(budgets.map((budget) => verifyBudgetPeriods({ budget })))
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

async function findBudgetLatestPeriodConfig({
  budgetId,
}: {
  budgetId: string
}) {
  return prisma.budgetPeriodConfig.findFirst({
    where: {
      budgetId,
    },
    orderBy: {
      startDate: 'desc',
    },
  })
}

async function findPeriodConfigByDate({
  budgetId,
  date,
}: { budgetId: string; date: Date }) {
  return prisma.budgetPeriodConfig.findFirst({
    where: {
      budgetId,
      startDate: {
        lte: date,
      },
      endDate: {
        gte: date,
      },
    },
  })
}

async function verifyBudgetPeriods({
  budget,
  anchorDate = new Date(),
}: { budget: BudgetPopulated; anchorDate?: Date }) {
  const latestPeriodConfig = await findBudgetLatestPeriodConfig({
    budgetId: budget.id,
  })

  if (!latestPeriodConfig) {
    return budget
  }

  const periodConfig = await findPeriodConfigByDate({
    budgetId: budget.id,
    date: anchorDate,
  })

  if (!periodConfig) {
    await prisma.budgetPeriodConfig.create({
      data: {
        type: latestPeriodConfig.type,
        amount: latestPeriodConfig.amount,
        budgetId: budget.id,
        ...calculateBudgetPeriodStartEndDates({
          anchorDate,
          type: latestPeriodConfig.type,
        }),
      },
    })
  }

  return prisma.budget.findUnique({
    where: { id: budget.id },
    include: BUDGET_INCLUDE,
  })
}
