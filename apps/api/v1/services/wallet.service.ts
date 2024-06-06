import prisma from '@/lib/prisma'
import type { User, UserWalletAccount } from '@prisma/client'
import type { CreateWallet, UpdateWallet } from '../validation'

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
    _sum: { amount: true },
  })

  return balance._sum.amount || 0
}

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
export async function canUserCreateWallet({ user }: { user: User }) {
  return true
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

export async function walletWithBalance(wallet: UserWalletAccount) {
  const balance = await getWalletBalance({ wallet })
  return { ...wallet, balance }
}
