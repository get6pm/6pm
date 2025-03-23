import type { User } from '../.generated/client/index.js'
import { prisma } from '../client.js'
import { clerkClient } from './clerk.js'

export async function findUser({ id }: { id: string }): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } })
}

export async function syncClerkUser(userId: string): Promise<User> {
  const clerkUser = await clerkClient.users.getUser(userId)
  const user = await prisma.user.upsert({
    where: { id: clerkUser.id },
    update: {},
    create: {
      id: clerkUser.id,
    },
  })

  return user
}
