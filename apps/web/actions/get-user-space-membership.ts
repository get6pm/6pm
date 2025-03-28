'use server'

import { prisma } from '@6pm/db'
import { auth } from '@clerk/nextjs/server'
import { createServerAction } from './helpers'

export const getUserSpaceMembership = createServerAction(
  async ({ spaceId }: { spaceId: string }) => {
    const { userId } = await auth()

    if (!userId) {
      return null
    }

    const membership = await prisma.spaceMembership.findUnique({
      // biome-ignore lint/style/useNamingConvention: <explanation>
      where: { spaceId_userId: { spaceId, userId } },
    })

    return membership
  },
)
