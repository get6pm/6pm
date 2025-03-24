'use server'
import ErrorCode from '@/constants/error-codes'
import { type UpdateSpaceValues, zUpdateSpace } from '@/schemas/space'
import { SpaceRole, prisma } from '@6pm/db'
import { revalidatePath } from 'next/cache'
import { createServerAction } from './helpers'
import { doesUserHaveSpaceRole } from './space-permission'

export const canUserUpdateSpace = createServerAction(
  async ({ spaceId }: { spaceId: string }) => {
    const { data: isOwner } = await doesUserHaveSpaceRole({
      spaceId,
      role: SpaceRole.OWNER,
    })

    return !!isOwner
  },
)

export const updateSpace = createServerAction(
  async ({ spaceId, data }: { spaceId: string; data: UpdateSpaceValues }) => {
    data = zUpdateSpace.parse(data)

    const canUpdateSpace = await canUserUpdateSpace({ spaceId })

    if (!canUpdateSpace) {
      throw new Error(ErrorCode.Forbidden)
    }

    const existingSpace = await prisma.space.findUnique({
      where: { id: spaceId },
      select: { id: true, name: true },
    })

    if (!existingSpace) {
      throw new Error(`Space not found: ${spaceId}`)
    }

    const updatedSpace = await prisma.space.update({
      where: { id: spaceId },
      data: { ...data },
    })

    revalidatePath(`/spaces/${spaceId}`)

    return updatedSpace
  },
)
