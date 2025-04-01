'use server'
import ErrorCode from '@/constants/error-codes'
import { type TransactionValues, zTransaction } from '@/schemas/transaction'
import { prisma } from '@6pm/db'
import { omit } from 'lodash-es'
import { getUserSpaceMembership } from './get-user-space-membership'
import { createServerAction } from './helpers'
import { doesUserBelongToSpace } from './space-permission'

export const canUserCreateSpaceTransaction = createServerAction(
  async ({ spaceId }: { spaceId: string }) => {
    const { data: doesBelong } = await doesUserBelongToSpace({ spaceId })

    const exceedLimit = false
    const yes = doesBelong && !exceedLimit

    return { yes, doesBelong, exceedLimit }
  },
)

export const createTransaction = createServerAction(
  async ({ spaceId, data }: { spaceId: string; data: TransactionValues }) => {
    data = zTransaction.parse(data)

    const canCreate = await canUserCreateSpaceTransaction({ spaceId })
    const { data: membership } = await getUserSpaceMembership({ spaceId })

    if (!(canCreate.data?.yes && membership)) {
      throw new Error(ErrorCode.Forbidden)
    }

    const amount = Math.abs(data.amount) * (data.isNegative ? -1 : 1)

    const newTransaction = await prisma.transaction.create({
      data: {
        ...omit(data, 'isNegative', 'amount', 'tagIds'),
        amount,
        spaceId,
        memberId: membership.id,
      },
    })

    return newTransaction
  },
)
