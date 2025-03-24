import ErrorCode from '@/constants/error-codes'
import { prisma } from '@6pm/db'
import { auth } from '@clerk/nextjs/server'
import { createServerAction } from './helpers'

export const getAuthUser = createServerAction(async () => {
  const { userId } = await auth()

  if (!userId) {
    throw new Error(ErrorCode.Unauthorized)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { spaceMemberships: { include: { space: true } }, metadata: true },
  })

  return user
})
