'use server'

import ErrorCode from '@/constants/error-codes'
import { type AccountValues, zAccount } from '@/schemas/account'
import { SpaceRole, prisma } from '@6pm/db'
import { revalidatePath } from 'next/cache'
import { createServerAction } from './helpers'
import { doesUserHaveSpaceRole } from './space-permission'

export const canUserCreateSpaceAccount = createServerAction(
  async ({ spaceId }: { spaceId: string }) => {
    const { data: isOwner } = await doesUserHaveSpaceRole({
      spaceId,
      anyRole: [SpaceRole.OWNER, SpaceRole.ADMIN],
    })

    const exceedLimit = false
    const yes = isOwner && !exceedLimit

    return { yes, isOwner, exceedLimit }
  },
)

export const createAccount = createServerAction(
  async ({ spaceId, data }: { spaceId: string; data: AccountValues }) => {
    data = zAccount.parse(data)

    const canCreate = await canUserCreateSpaceAccount({ spaceId })

    if (!canCreate.data?.yes) {
      throw new Error(ErrorCode.Forbidden)
    }

    const newAccount = await prisma.account.create({
      data: {
        ...data,
        spaceId,
      },
    })

    revalidatePath(`/app/spaces/${spaceId}/accounts`)

    return newAccount
  },
)
