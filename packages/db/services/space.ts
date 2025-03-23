import { type Space, SpaceRole, type User } from '../.generated/client/index.js'
import { prisma } from '../client.js'

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

export async function canUserUpdateSpace({
  user,
  space,
}: { user: User; space: Space }) {
  const spaceMembership = await prisma.spaceMembership.findUnique({
    where: {
      // biome-ignore lint/style/useNamingConvention: prisma predefined
      spaceId_userId: {
        spaceId: space.id,
        userId: user.id,
      },
    },
  })

  return spaceMembership?.role === SpaceRole.OWNER
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
