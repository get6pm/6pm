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

export async function createUser(data: CreateUser) {
  return await prisma.user.create({
    data,
  })
}
