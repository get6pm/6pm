import prisma from '@/lib/prisma'
import type {
  Budget,
  Transaction,
  User,
  UserWalletAccount,
} from '@prisma/client'
import type {
  CreateTransaction,
  UpdateTransaction,
} from '../validation/transaction.zod'
import {
  findBudget,
  isUserBudgetMember,
  isUserBudgetOwner,
} from './budget.service'

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

export async function canUserReadTransaction({
  user,
  transaction,
}: {
  user: User
  transaction: Transaction
}) {
  // If user is the creator of the transaction, they can read it
  if (transaction.createdByUserId === user.id) {
    return true
  }

  // If user is the member of the budget of the transaction, they can read it
  if (transaction.budgetId) {
    const budget = await findBudget({ budgetId: transaction.budgetId })
    return budget && (await isUserBudgetMember({ user, budget }))
  }

  return false
}

export async function canUserUpdateTransaction({
  user,
  transaction,
  walletAccount,
}: {
  user: User
  transaction: Transaction
  walletAccount: UserWalletAccount | null
}) {
  // If wallet is provided, user must own the wallet
  if (walletAccount && walletAccount.userId !== user.id) {
    return false
  }

  // If user is the creator of the transaction, they can update it
  if (transaction.createdByUserId === user.id) {
    return true
  }

  // If user owns the budget of the transaction, they can update it
  if (transaction.budgetId) {
    const budget = await findBudget({ budgetId: transaction.budgetId })
    return budget && (await isUserBudgetOwner({ user, budget }))
  }

  return false
}

export async function findTransaction({
  transactionId,
}: {
  transactionId: string
}) {
  return prisma.transaction.findUnique({
    where: {
      id: transactionId,
    },
  })
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

export async function updateTransaction({
  transactionId,
  data,
}: {
  transactionId: string
  data: UpdateTransaction
}) {
  const transaction = await prisma.transaction.update({
    where: {
      id: transactionId,
    },
    data,
  })

  return transaction
}
