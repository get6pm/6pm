import type { BudgetPopulated } from '@6pm/validation'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface BudgetStore {
  budgets: BudgetPopulated[]
  setBudgets: (budgets: BudgetPopulated[]) => void
  updateBudget: (budget: BudgetPopulated) => void
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set) => ({
      budgets: [] as BudgetPopulated[],
      setBudgets: (budgets: BudgetPopulated[]) => set({ budgets }),
      updateBudget: (budget: BudgetPopulated) =>
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
