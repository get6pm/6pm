import type { Budget, BudgetPeriodConfig } from '@6pm/validation'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type BudgetItem = Budget & {
  periodConfigs: BudgetPeriodConfig[]
}

interface BudgetStore {
  budgets: BudgetItem[]
  _reset: () => void
  setBudgets: (budgets: BudgetItem[]) => void
  updateBudget: (budget: BudgetItem) => void
  removeBudget: (budgetId: string) => void
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set) => ({
      budgets: [],
      // biome-ignore lint/style/useNamingConvention: <explanation>
      _reset: () => set({ budgets: [] }),
      setBudgets: (budgets: BudgetItem[]) => set({ budgets }),
      updateBudget: (budget: BudgetItem) =>
        set((state) => {
          const index = state.budgets.findIndex((c) => c.id === budget.id)
          if (index === -1) {
            return {
              budgets: [...state.budgets, budget],
            }
          }

          return {
            budgets: state.budgets.map((c) =>
              c.id === budget.id ? budget : c,
            ),
          }
        }),
      removeBudget: (budgetId) =>
        set((state) => {
          return { budgets: state.budgets.filter((c) => c.id !== budgetId) }
        }),
    }),
    {
      name: 'budget-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
