import prisma from '@/lib/prisma'
import type { Budget, User, UserWalletAccount } from '@prisma/client'
import type { CreateTransaction } from '../validation/transaction.zod'
import { isUserBudgetMember } from './budget.service'

export async function canUserCreateTransaction({
  user,
  budget,
  walletAccount,
}: {
  user: User
  budget: Budget | null
  walletAccount: UserWalletAccount | null
}) {
  // If budget is provided, user must be a member of the budget
  if (budget && !(await isUserBudgetMember({ user, budget }))) {
    return false
  }

  // If wallet is provided, user must own the wallet
  if (walletAccount && walletAccount.userId !== user.id) {
    return false
  }

  return true
}

export async function createTransaction({
  user,
  data,
}: {
  user: User
  data: CreateTransaction
}) {
  const transaction = await prisma.transaction.create({
    data: {
      ...data,
      createdByUserId: user.id,
    },
  })

  return transaction
}
