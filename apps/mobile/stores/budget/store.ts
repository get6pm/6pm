import type { BudgetWithRelations } from '@6pm/validation'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface BudgetStore {
  budgets: BudgetWithRelations[]
  setBudgets: (budgets: BudgetWithRelations[]) => void
  updateBudget: (budget: BudgetWithRelations) => void
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set) => ({
      budgets: [],
      setBudgets: (budgets: BudgetWithRelations[]) => set({ budgets }),
      updateBudget: (budget: BudgetWithRelations) =>
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
