'use server'

import { type SpaceRole, prisma } from '@6pm/db'
import { auth } from '@clerk/nextjs/server'
import { createServerAction } from './helpers'

export const doesUserBelongToSpace = createServerAction(
  async ({ spaceId }: { spaceId: string }) => {
    const { userId } = await auth()
    if (!userId) {
      return false
    }

    const spaceMembership = await prisma.spaceMembership.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: <explanation>
        spaceId_userId: {
          userId,
          spaceId,
        },
      },
    })

    return !!spaceMembership
  },
)

export const doesUserHaveSpaceRole = createServerAction(
  async ({
    spaceId,
    ...roleRules
  }: { spaceId: string } & (
    | { role: SpaceRole }
    | { allRoles: SpaceRole[] }
    | { anyRole: SpaceRole[] }
  )) => {
    const { userId } = await auth()
    if (!userId) {
      return false
    }

    const spaceMembership = await prisma.spaceMembership.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: <explanation>
        spaceId_userId: {
          userId,
          spaceId,
        },
      },
    })

    if (!spaceMembership) {
      return false
    }

    if ('role' in roleRules) {
      return spaceMembership.role === roleRules.role
    }

    if ('allRoles' in roleRules) {
      return roleRules.allRoles.every((role) => spaceMembership.role === role)
    }

    if ('anyRole' in roleRules) {
      return roleRules.anyRole.some((role) => spaceMembership.role === role)
    }

    return false
  },
)
