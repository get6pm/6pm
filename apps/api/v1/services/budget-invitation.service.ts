import prisma from '@/lib/prisma'
import {
  type Budget,
  type BudgetUserInvitation,
  BudgetUserPermission,
  type User,
} from '@prisma/client'
import { isUserBudgetOwner } from './budget.service'

export async function canUserInviteUserToBudget({
  user,
  budget,
}: {
  user: User
  budget: Budget
}): Promise<boolean> {
  return isUserBudgetOwner({ user, budget })
}

export async function inviteUserToBudget({
  inviter,
  budget,
  email,
  permission = BudgetUserPermission.MEMBER,
}: {
  inviter: User
  budget: Budget
  email: string
  permission?: BudgetUserPermission
}) {
  // Check if inviter has permission to invite user
  if (!(await canUserInviteUserToBudget({ user: inviter, budget }))) {
    throw new Error(
      'User does not have permission to invite users to this budget',
    )
  }

  let invitation: BudgetUserInvitation | null =
    await prisma.budgetUserInvitation.findFirst({
      where: {
        budgetId: budget.id,
        email,
      },
    })

  if (invitation) {
    return invitation
  }

  invitation = await prisma.budgetUserInvitation.create({
    data: {
      email,
      permission,
      budgetId: budget.id,
      createdByUserId: inviter.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      token: Math.random().toString(36).substring(2), // uuid-like
    },
  })

  // TODO: Send email to invitee

  return invitation
}
