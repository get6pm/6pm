import { getPlanConfig } from '@6pm/utilities'
import type { CreateWallet, UpdateWallet } from '@6pm/validation'
import type { User, UserWalletAccount } from '@prisma/client'
import prisma from '../../lib/prisma'
import { DEFAULT_WALLETS } from '../constants/wallet.const'
import { getUserPlan } from './user.service'

export async function findUserWallet({
  user,
  walletId,
}: {
  user: User
  walletId: string
}) {
  return await prisma.userWalletAccount.findUnique({
    where: { id: walletId, userId: user.id },
  })
}

export async function createWallet({
  user,
  data: { name, icon, description, lastDigits, preferredCurrency },
}: {
  user: User
  data: CreateWallet
}) {
  return await prisma.userWalletAccount.create({
    data: {
      userId: user.id,
      name,
      icon,
      description,
      lastDigits,
      preferredCurrency,
    },
  })
}

export async function updateWallet({
  walletId,
  data,
}: {
  walletId: string
  data: UpdateWallet
}) {
  return await prisma.userWalletAccount.update({
    where: { id: walletId },
    data,
  })
}

export async function deleteWallet({
  walletId,
}: {
  walletId: string
}) {
  return await prisma.userWalletAccount.delete({
    where: { id: walletId },
  })
}

export async function findUserWallets({ user }: { user: User }) {
  return await prisma.userWalletAccount.findMany({
    where: { userId: user.id },
  })
}

export async function getWalletBalance({
  wallet,
}: { wallet: UserWalletAccount }) {
  const balance = await prisma.transaction.aggregate({
    where: { walletAccountId: wallet.id },
    // biome-ignore lint/style/useNamingConvention: <explanation>
    _sum: { amountInVnd: true },
  })

  return balance._sum.amountInVnd || 0
}

export async function canUserCreateWallet({ user }: { user: User }) {
  const wallets = await findUserWallets({ user })
  const userPlan = getUserPlan(user)
  const maxWallets = getPlanConfig(userPlan, 'maxWallets')

  return maxWallets !== null && wallets.length < maxWallets
}

export async function canUserUpdateWallet({
  user,
  walletId,
}: {
  user: User
  walletId: string
}) {
  const wallet = await findUserWallet({ user, walletId })
  return !!wallet
}

export async function canUserDeleteWallet({
  user,
  walletId,
}: {
  user: User
  walletId: string
}) {
  return await canUserUpdateWallet({ user, walletId })
}

export async function canUserReadWallet({
  user,
  walletId,
}: {
  user: User
  walletId: string
}) {
  return await canUserUpdateWallet({ user, walletId })
}

export async function walletWithBalance(wallet: UserWalletAccount) {
  const balance = await getWalletBalance({ wallet })
  return { ...wallet, balance }
}

export async function bootstrapUserDefaultWalletAccounts({
  user,
  language,
  preferredCurrency = 'USD',
}: { user: User; language?: string; preferredCurrency?: string }) {
  const defaultWallets = DEFAULT_WALLETS.map(({ vi, en, ...wallet }) => ({
    ...wallet,
    name: language === 'vi' ? vi : en,
  }))

  return await prisma.userWalletAccount.createMany({
    data: defaultWallets.map((wallet) => ({
      ...wallet,
      preferredCurrency,
      userId: user.id,
    })),
  })
}
