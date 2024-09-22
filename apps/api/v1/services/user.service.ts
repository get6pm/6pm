import type { CreateUser } from '@6pm/validation'
import type { User } from '@prisma/client'
import { getLogger } from '../../lib/log'
import prisma from '../../lib/prisma'
import {
  getCustomerActiveSubscription,
  getOrCreateCustomer,
} from './revenue-cat.service'

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

export async function syncUserSubscription(user: User) {
  const logger = getLogger(`${syncAllUsersSubscription.name}:${user.id}`)

  logger.info('Current user %o', user)

  const customer = await getOrCreateCustomer({
    userId: user.id,
  })

  const activeSubscription = getCustomerActiveSubscription(customer)

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      entitlement: activeSubscription?.entitlement ?? null,
      entitlementExpiresAt: activeSubscription?.subscription.expires_date
        ? new Date(activeSubscription.subscription.expires_date)
        : null,
      entitlementProductIdentifier:
        activeSubscription?.subscription.product_identifier ?? null,
    },
  })

  logger.info('Updated user %o', updatedUser)

  return updatedUser
}

export async function syncAllUsersSubscription() {
  const logger = getLogger(syncAllUsersSubscription.name)
  const users = await prisma.user.findMany()
  const failed = []

  logger.info('Syncing %d users', users.length)

  for (const user of users) {
    try {
      await syncUserSubscription(user)
      logger.info('Synced user %s', user.email)
    } catch (error) {
      failed.push(user.email)

      logger.warn('Failed to sync user %s', user.email)
      logger.error(error)
    }
  }

  logger.info('Synced %d users. Failed %d', users.length, failed.length)

  return {
    total: users.length,
    success: users.length - failed.length,
    failed,
  }
}
