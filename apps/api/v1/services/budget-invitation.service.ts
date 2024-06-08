import prisma from '@/lib/prisma'
import {
  type Budget,
  type BudgetUserInvitation,
  BudgetUserPermission,
  type User,
} from '@prisma/client'
import type { CreateUser } from '../validation'
import { createBudgetUser, isUserBudgetOwner } from './budget.service'
import { createUser, findUserByEmail } from './user.service'

export async function canUserInviteUserToBudget({
  user,
  budget,
}: {
  user: User
  budget: Budget
}): Promise<boolean> {
  return isUserBudgetOwner({ user, budget })
}

export async function canUserReadBudgetInvitations({
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

export async function canUserGenerateBudgetInvitation({
  user,
  budget,
}: {
  user: User
  budget: Budget
}): Promise<boolean> {
  return isUserBudgetOwner({ user, budget })
}

export async function generateBudgetInvitation({
  budgetId,
  userId,
}: { budgetId: string; userId: string }) {
  let invitation = await prisma.budgetUserInvitation.findFirst({
    where: {
      budgetId,
      email: null,
    },
  })

  if (invitation) {
    invitation = await prisma.budgetUserInvitation.update({
      where: { id: invitation.id },
      data: {
        expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years
        token: Math.random().toString(36).substring(2), // uuid-like
      },
    })

    return invitation
  }

  invitation = await prisma.budgetUserInvitation.create({
    data: {
      budgetId,
      token: Math.random().toString(36).substring(2), // uuid-like
      createdByUserId: userId,
      expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years
      permission: BudgetUserPermission.MEMBER,
    },
  })

  return invitation
}

export async function findBudgetInvitations({
  budgetId,
  permission,
}: { budgetId: string; permission?: BudgetUserPermission }) {
  return prisma.budgetUserInvitation.findMany({
    where: {
      budgetId,
      permission,
    },
  })
}

export async function canUserDeleteBudgetInvitation({
  user,
  invitation,
}: {
  user: User
  invitation: BudgetUserInvitation
}): Promise<boolean> {
  const budget = await prisma.budget.findUnique({
    where: { id: invitation.budgetId },
  })

  if (!budget) {
    return false
  }

  return isUserBudgetOwner({ user, budget })
}

export async function deleteBudgetInvitation({
  invitationId,
}: {
  invitationId: string
}) {
  return prisma.budgetUserInvitation.delete({
    where: { id: invitationId },
  })
}

export async function verifyBudgetInvitationToken({
  token,
}: {
  token: string
}): Promise<BudgetUserInvitation | null> {
  const invitation = await prisma.budgetUserInvitation.findFirst({
    where: {
      token,
    },
  })

  if (!invitation) {
    return null
  }

  if (invitation.expiresAt < new Date()) {
    return null
  }

  return invitation
}

export async function respondToBudgetInvitation({
  invitation,
  accept,
  userData,
}: {
  invitation: BudgetUserInvitation
  accept: boolean
  userData: CreateUser
}) {
  if (!accept) {
    const declinedAt = new Date()

    await prisma.budgetUserInvitationResponse.create({
      data: {
        invitationId: invitation.id,
        declinedAt,
      },
    })

    return { accepted: false, declinedAt }
  }

  // Create find or new user
  const user =
    (await findUserByEmail(userData.email)) || (await createUser(userData))

  // Create invitation response
  const acceptedAt = new Date()
  await prisma.budgetUserInvitationResponse.create({
    data: {
      invitationId: invitation.id,
      createdUserId: user.id,
      acceptedAt,
    },
  })

  // Add user to budget
  const budgetUser = await createBudgetUser({
    userId: user.id,
    budgetId: invitation.budgetId,
    permission: invitation.permission || BudgetUserPermission.MEMBER,
  })

  return { accepted: true, acceptedAt, user, budgetUser }
}
