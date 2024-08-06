import { useCallback } from 'react'
import { useBudgetStore } from '../budget/store'
import { useCategoryStore } from '../category/store'
import { useTransactionStore } from '../transaction/store'

export const useResetAllStores = () => {
  const resetBudgetStore = useBudgetStore((state) => state._reset)
  const resetCategoryStore = useCategoryStore((state) => state._reset)
  const resetTransactionStore = useTransactionStore((state) => state._reset)

  const resetAllStores = useCallback(() => {
    resetBudgetStore()
    resetCategoryStore()
    resetTransactionStore()
  }, [resetBudgetStore, resetCategoryStore, resetTransactionStore])

  return resetAllStores
}
