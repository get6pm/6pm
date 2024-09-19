import type { CreateUser } from '@6pm/validation'
import prisma from '../../lib/prisma'

export async function findUserById(id: string) {
  return await prisma.user.findUnique({
    where: {
      id,
    },
  })
}

export async function findUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: {
      email,
    },
  })
}

export async function createUser({ data }: { data: CreateUser }) {
  const user = await prisma.user.upsert({
    where: {
      id: data.id,
      email: data.email,
    },
    create: data,
    update: data,
  })

  return user
}

export async function deleteUser(userId: string) {
  return await prisma.user.delete({
    where: {
      id: userId,
    },
  })
}
