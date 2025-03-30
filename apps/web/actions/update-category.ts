'use server'

import ErrorCode from '@/constants/error-codes'
import { type CategoryValues, zCategory } from '@/schemas/category'
import { SpaceRole, prisma } from '@6pm/db'
import { createServerAction } from './helpers'
import { doesUserHaveSpaceRole } from './space-permission'

export const canUserUpdateSpaceCategory = createServerAction(
  async ({ spaceId }: { spaceId: string }) => {
    const { data: isOwner } = await doesUserHaveSpaceRole({
      spaceId,
      anyRole: [SpaceRole.OWNER, SpaceRole.ADMIN],
    })

    const yes = isOwner

    return { yes, isOwner }
  },
)

export const updateCategory = createServerAction(
  async ({ data }: { data: CategoryValues }) => {
    data = zCategory.parse(data)

    let category = await prisma.spendingCategory.findUnique({
      where: { id: data.id },
    })

    if (!category) {
      throw new Error(ErrorCode.NotFound)
    }

    const canUpdateCategory = await canUserUpdateSpaceCategory({
      spaceId: category.spaceId,
    })

    if (!canUpdateCategory.data?.yes) {
      throw new Error(ErrorCode.Forbidden)
    }

    category = await prisma.spendingCategory.update({
      where: { id: data.id },
      data: {
        name: data.name,
        icon: data.icon,
        color: data.color,
      },
    })

    return category
  },
)
