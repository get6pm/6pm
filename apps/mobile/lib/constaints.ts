export type Entitlement = 'wealth' | 'growth' | 'free'

export const ENTITLEMENT_LIMIT: Record<Entitlement, Record<string, number>> = {
  free: {
    'ai-transactions': 2,
    budgets: 3,
    wallets: 3,
  },
  growth: {
    'ai-transactions': 10,
    budgets: 6,
    wallets: 6,
  },
  wealth: {
    'ai-transactions': 25,
    budgets: Infinity,
    wallets: Infinity,
  },
}
