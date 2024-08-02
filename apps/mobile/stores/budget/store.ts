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

          state.budgets[index] = budget
          return { budgets: state.budgets }
        }),
    }),
    {
      name: 'budget-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
