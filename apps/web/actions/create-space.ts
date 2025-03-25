'use server'
import ErrorCode from '@/constants/error-codes'
import { type CreateSpaceValues, zCreateSpace } from '@/schemas/space'
import { SpaceRole, prisma } from '@6pm/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createServerAction } from './helpers'

export const canUserCreateSpace = createServerAction(async () => {
  const { userId } = await auth()

  if (!userId) {
    return false
  }

  const spacesOwnedByUser = await prisma.spaceMembership.aggregate({
    where: {
      userId,
      role: SpaceRole.OWNER,
    },
    // biome-ignore lint/style/useNamingConvention: <explanation>
    _count: true,
  })

  return spacesOwnedByUser._count < 10
})

export const createSpace = createServerAction(
  async (input: CreateSpaceValues) => {
    const parsedInput = zCreateSpace.parse(input)
    const { userId } = await auth()

    if (!userId) {
      throw new Error(ErrorCode.Unauthorized)
    }

    const canCreateSpace = await canUserCreateSpace()

    if (!canCreateSpace) {
      throw new Error(ErrorCode.Forbidden)
    }

    const space = await prisma.space.create({
      data: {
        ...parsedInput,
        spaceMemberships: {
          create: {
            role: SpaceRole.OWNER,
            userId,
          },
        },
      },
      include: {
        spaceMemberships: true,
      },
    })

    revalidatePath('/spaces')

    return space
  },
)
