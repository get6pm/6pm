'use server'

import ErrorCode from '@/constants/error-codes'
import { prisma } from '@6pm/db'
import { auth } from '@clerk/nextjs/server'
import { createServerAction } from './helpers'

export const getUserSpaceMemberships = createServerAction(async () => {
  const { userId } = await auth()
  if (!userId) {
    throw new Error(ErrorCode.Unauthorized)
  }
  const memberships = await prisma.spaceMembership.findMany({
    where: { userId },
    include: {
      space: {
        include: {
          accounts: true,
          categories: true,
          transactions: true,
        },
      },
    },
  })
  return memberships
})
