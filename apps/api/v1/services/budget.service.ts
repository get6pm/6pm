import { calculateBudgetPeriodStartEndDates } from '@6pm/utilities'
import type { CreateBudget, UpdateBudget } from '@6pm/validation'
import { type Budget, BudgetUserPermission, type User } from '@prisma/client'
import prisma from '../../lib/prisma'
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
    include: {
      periodConfig: true,
    },
  })
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
    include: {
      periodConfig: true,
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
