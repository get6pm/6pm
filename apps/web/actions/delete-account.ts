'use server'

import ErrorCode from '@/constants/error-codes'
import { SpaceRole, prisma } from '@6pm/db'
import { createServerAction } from './helpers'
import { doesUserHaveSpaceRole } from './space-permission'

export const canUserDeleteSpaceAccount = createServerAction(
  async ({ spaceId }: { spaceId: string }) => {
    const { data: isOwner } = await doesUserHaveSpaceRole({
      spaceId,
      anyRole: [SpaceRole.OWNER, SpaceRole.ADMIN],
    })

    const yes = isOwner

    return { yes, isOwner }
  },
)

export const deleteAccount = createServerAction(
  async ({ id }: { id: string }) => {
    let account = await prisma.account.findUnique({
      where: { id },
    })

    if (!account) {
      throw new Error(ErrorCode.NotFound)
    }

    const canDeleteAccount = await canUserDeleteSpaceAccount({
      spaceId: account.spaceId,
    })

    if (!canDeleteAccount.data?.yes) {
      throw new Error(ErrorCode.Forbidden)
    }

    account = await prisma.account.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return account
  },
)
