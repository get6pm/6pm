import type { CreateTransaction, UpdateTransaction } from '@6pm/validation'
import type {
  Budget,
  Transaction,
  User,
  UserWalletAccount,
} from '@prisma/client'
import prisma from '../../lib/prisma'
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

export async function canUserDeleteTransaction({
  user,
  transaction,
}: {
  user: User
  transaction: Transaction
}) {
  return canUserUpdateTransaction({ user, transaction, walletAccount: null })
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

export async function deleteTransaction({
  transactionId,
}: {
  transactionId: string
}) {
  await prisma.transaction.delete({
    where: {
      id: transactionId,
    },
  })
}

export async function listTransactions({
  query,
  pagination,
}: {
  query: {
    createdByUserId?: string
    budgetId?: string
    walletAccountId?: string
  }
  pagination: {
    before?: Date
    last?: number
    after?: Date
    first?: number
  }
}) {
  const transactions = await prisma.transaction.findMany({
    where: {
      ...query,
      createdAt: {
        ...(pagination.before && {
          lt: pagination.before,
        }),
        ...(pagination.after && {
          gt: pagination.after,
        }),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: pagination.first || pagination.last,
  })

  const totalCount = await prisma.transaction.count({
    where: query,
  })

  const paginationMeta = {
    hasMore: transactions.length > (pagination.first || pagination.last || 0),
    totalCount,
    ...(pagination.first && {
      before: transactions[0]?.createdAt,
    }),
    ...(pagination.last && {
      after: transactions[transactions.length - 1]?.createdAt,
    }),
  }

  return { transactions, meta: { paginationMeta } }
}
