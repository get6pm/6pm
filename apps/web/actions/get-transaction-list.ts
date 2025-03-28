'use server'

import ErrorCode from '@/constants/error-codes'
import { prisma } from '@6pm/db'
import { createServerAction } from './helpers'
import { doesUserBelongToSpace } from './space-permission'

const TAKE = 50

export const canUserGetTransactionList = createServerAction(
  async ({ spaceId }: { spaceId: string }) => {
    const { data: doesBelong } = await doesUserBelongToSpace({ spaceId })

    return { yes: doesBelong }
  },
)

export const getTransactionList = createServerAction(
  async ({
    spaceId,
    before,
    categoryIds,
    accountIds,
    tagIds,
  }: {
    spaceId: string
    before?: Date
    categoryIds?: string[]
    accountIds?: string[]
    tagIds?: string[]
  }) => {
    const canGet = await canUserGetTransactionList({ spaceId })

    if (!canGet.data?.yes) {
      throw new Error(ErrorCode.Forbidden)
    }

    return prisma.transaction.findMany({
      where: {
        spaceId,
        date: before ? { lt: before } : undefined,
        categoryId: categoryIds ? { in: categoryIds } : undefined,
        accountId: accountIds ? { in: accountIds } : undefined,
        tags: tagIds ? { some: { id: { in: tagIds } } } : undefined,
      },
      take: TAKE,
      orderBy: {
        date: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            institution: true,
            lastDigits: true,
            color: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            isExclusive: true,
          },
        },
      },
    })
  },
)
