'use server'
import ErrorCode from '@/constants/error-codes'
import { prisma } from '@6pm/db'
import { auth } from '@clerk/nextjs/server'
import { createServerAction } from './helpers'

export const updateUserMetadata = createServerAction(
  async ({ key, value }: { key: string; value: string }) => {
    const { userId } = await auth()

    if (!userId) {
      throw new Error(ErrorCode.Unauthorized)
    }

    if (!(key && value)) {
      throw new Error(ErrorCode.InvalidInput)
    }

    await prisma.userMetadata.upsert({
      // biome-ignore lint/style/useNamingConvention: predefined by Prisma
      where: { userId_key: { userId, key } },
      update: { value },
      create: { userId, key, value },
    })

    const userMetadata = await prisma.userMetadata.findMany({
      where: { userId },
    })

    return userMetadata
  },
)
