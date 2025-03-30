'use server'

import ErrorCode from '@/constants/error-codes'
import { SpaceRole, prisma } from '@6pm/db'
import { createServerAction } from './helpers'
import { doesUserHaveSpaceRole } from './space-permission'

export const canUserDeleteSpaceCategory = createServerAction(
  async ({ spaceId }: { spaceId: string }) => {
    const { data: isOwner } = await doesUserHaveSpaceRole({
      spaceId,
      anyRole: [SpaceRole.OWNER, SpaceRole.ADMIN],
    })

    const yes = isOwner

    return { yes, isOwner }
  },
)

export const deleteCategory = createServerAction(
  async ({ id }: { id: string }) => {
    let category = await prisma.spendingCategory.findUnique({
      where: { id },
    })

    if (!category) {
      throw new Error(ErrorCode.NotFound)
    }

    const canDeleteCategory = await canUserDeleteSpaceCategory({
      spaceId: category.spaceId,
    })

    if (!canDeleteCategory.data?.yes) {
      throw new Error(ErrorCode.Forbidden)
    }

    category = await prisma.spendingCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return category
  },
)
