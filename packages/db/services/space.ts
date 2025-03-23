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
