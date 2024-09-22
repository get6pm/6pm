export enum UserEntitlement {
  Saver = 'saver',
  Growth = 'growth',
  Wealth = 'wealth',
}

export type PlanConfig = {
  maxTransactions: number
  maxBudgets: number
  maxWallets: number
  canCreateCategories: boolean
  maxAiTransactionPerDay: number
  maxJoinableBudgets: number
  maxOwnedBudgets: number
  transactionRetentionDays: number
}

/** Follows [[RFC] Monetization #132](https://github.com/get6pm/6pm/issues/132). */
export const PLAN_CONFIG: Record<UserEntitlement, PlanConfig> = {
  saver: {
    maxTransactions: Infinity,
    maxBudgets: 3,
    maxWallets: 3,
    canCreateCategories: false,
    maxAiTransactionPerDay: 2,
    maxJoinableBudgets: Infinity,
    maxOwnedBudgets: 1,
    transactionRetentionDays: 60,
  },
  growth: {
    maxTransactions: Infinity,
    maxBudgets: 6,
    maxWallets: 6,
    canCreateCategories: true,
    maxAiTransactionPerDay: 10,
    maxJoinableBudgets: Infinity,
    maxOwnedBudgets: 5,
    transactionRetentionDays: 180,
  },
  wealth: {
    maxTransactions: Infinity,
    maxBudgets: Infinity,
    maxWallets: Infinity,
    canCreateCategories: true,
    maxAiTransactionPerDay: 25,
    maxJoinableBudgets: Infinity,
    maxOwnedBudgets: Infinity,
    transactionRetentionDays: Infinity,
  },
}

export function getPlanConfig<
  P extends UserEntitlement,
  K extends keyof PlanConfig,
>(plan: P, key: K): PlanConfig[K] | null {
  return PLAN_CONFIG[plan][key] ?? null
}
