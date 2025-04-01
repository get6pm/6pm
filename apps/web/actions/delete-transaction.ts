'use server'
import ErrorCode from '@/constants/error-codes'
import { prisma } from '@6pm/db'
import { createServerAction } from './helpers'
import { doesUserBelongToSpace } from './space-permission'

export const canUserDeleteSpaceTransaction = createServerAction(
  async ({ spaceId }: { spaceId: string }) => {
    const { data: doesBelong } = await doesUserBelongToSpace({ spaceId })

    const yes = doesBelong

    return { yes, doesBelong }
  },
)

export const deleteTransaction = createServerAction(
  async ({ id }: { id: string }) => {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    })

    if (!transaction) {
      throw new Error(ErrorCode.NotFound)
    }

    const canDelete = await canUserDeleteSpaceTransaction({
      spaceId: transaction.spaceId,
    })

    if (!canDelete.data?.yes) {
      throw new Error(ErrorCode.Forbidden)
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        deletedAt: new Date(),
      },
    })

    return updatedTransaction
  },
)
