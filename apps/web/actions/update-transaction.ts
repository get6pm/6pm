'use server'
import ErrorCode from '@/constants/error-codes'
import { type TransactionValues, zTransaction } from '@/schemas/transaction'
import { prisma } from '@6pm/db'
import { omit } from 'lodash-es'
import { createServerAction } from './helpers'
import { doesUserBelongToSpace } from './space-permission'

export const canUserUpdateSpaceTransaction = createServerAction(
  async ({ spaceId }: { spaceId: string }) => {
    const { data: doesBelong } = await doesUserBelongToSpace({ spaceId })

    const yes = doesBelong

    return { yes, doesBelong }
  },
)

export const updateTransaction = createServerAction(
  async ({ data }: { data: TransactionValues }) => {
    data = zTransaction.parse(data)

    if (!data.id) {
      throw new Error(ErrorCode.InvalidInput)
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: data.id },
    })

    if (!transaction) {
      throw new Error(ErrorCode.NotFound)
    }

    const canCreate = await canUserUpdateSpaceTransaction({
      spaceId: transaction.spaceId,
    })

    if (!canCreate.data?.yes) {
      throw new Error(ErrorCode.Forbidden)
    }

    const amount = Math.abs(data.amount) * (data.isNegative ? -1 : 1)

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        ...omit(data, 'isNegative', 'amount', 'tagIds'),
        amount,
      },
    })

    return updatedTransaction
  },
)
