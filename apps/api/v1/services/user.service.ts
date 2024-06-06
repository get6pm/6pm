import prisma from '@/lib/prisma'

export async function findUserById(id: string) {
  return await prisma.user.findUnique({
    where: {
      id,
    },
  })
}
