import { type Space, SpaceRole, type User } from '../.generated/client'
import { prisma } from '../client'

export async function createSpace(
  user: User,
  { name }: { name: string },
): Promise<Space> {
  return prisma.space.create({
    data: {
      name,
      spaceMemberships: {
        create: {
          role: SpaceRole.OWNER,
          userId: user.id,
        },
      },
    },
    include: {
      spaceMemberships: true,
    },
  })
}

export async function findSpace({
  id: spaceId,
}: { id: string }): Promise<Space | null> {
  return prisma.space.findUnique({
    where: {
      id: spaceId,
    },
    include: {
      spaceMemberships: true,
    },
  })
}

export async function findUserSpaceMembership({
  userId,
  spaceId,
}: { userId: string; spaceId: string }) {
  return prisma.spaceMembership.findUnique({
    where: {
      // biome-ignore lint/style/useNamingConvention: prisma predefined
      spaceId_userId: {
        spaceId,
        userId,
      },
    },
    include: {
      space: true,
      user: true,
    },
  })
}

export async function doesUserBelongToSpace({
  userId,
  spaceId,
}: { userId: string; spaceId: string }) {
  const userMembership = await findUserSpaceMembership({
    userId,
    spaceId,
  })

  return !!userMembership
}

export async function doesUserHaveSpaceRole({
  userId,
  spaceId,
  ...roleRules
}: { userId: string; spaceId: string } & (
  | { role: SpaceRole }
  | { allRoles: SpaceRole[] }
  | { anyRole: SpaceRole[] }
)) {
  const userMembership = await findUserSpaceMembership({
    userId,
    spaceId,
  })

  if (!userMembership) {
    return false
  }

  if ('role' in roleRules) {
    return userMembership.role === roleRules.role
  }

  if ('allRoles' in roleRules) {
    return roleRules.allRoles.every((role) => userMembership.role === role)
  }

  if ('anyRole' in roleRules) {
    return roleRules.anyRole.some((role) => userMembership.role === role)
  }

  return false
}

export async function canUserUpdateSpace({
  user,
  space,
}: { user: User; space: Space }) {
  return doesUserHaveSpaceRole({
    userId: user.id,
    spaceId: space.id,
    role: SpaceRole.OWNER,
  })
}

export async function updateSpace({
  user,
  id,
  data,
}: {
  user: User
  id: string
  data: { name: string }
}) {
  let space = await findSpace({ id })

  if (!space) {
    throw new Error(`Space not found: ${id}`)
  }

  const canUpdate = await canUserUpdateSpace({ user, space })
  if (!canUpdate) {
    throw new Error(`User does not have permission to update this space`)
  }

  space = await prisma.space.update({
    where: { id },
    data: {
      name: data.name,
    },
    include: {
      spaceMemberships: true,
    },
  })

  return space
}
