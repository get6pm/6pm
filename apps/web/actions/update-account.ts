'use server'

import ErrorCode from '@/constants/error-codes'
import { type AccountValues, zAccount } from '@/schemas/account'
import { SpaceRole, prisma } from '@6pm/db'
import { omit } from 'lodash-es'
import { createServerAction } from './helpers'
import { doesUserHaveSpaceRole } from './space-permission'

export const canUserUpdateSpaceAccount = createServerAction(
  async ({ spaceId }: { spaceId: string }) => {
    const { data: isOwner } = await doesUserHaveSpaceRole({
      spaceId,
      anyRole: [SpaceRole.OWNER, SpaceRole.ADMIN],
    })

    const yes = isOwner

    return { yes, isOwner }
  },
)

export const updateAccount = createServerAction(
  async ({ data }: { data: AccountValues }) => {
    data = zAccount.parse(data)

    let account = await prisma.account.findUnique({
      where: { id: data.id },
    })

    if (!account) {
      throw new Error(ErrorCode.NotFound)
    }

    const canUpdateAccount = await canUserUpdateSpaceAccount({
      spaceId: account.spaceId,
    })

    if (!canUpdateAccount.data?.yes) {
      throw new Error(ErrorCode.Forbidden)
    }

    account = await prisma.account.update({
      where: { id: data.id },
      data: {
        ...omit(data, ['id']),
      },
    })

    return account
  },
)
