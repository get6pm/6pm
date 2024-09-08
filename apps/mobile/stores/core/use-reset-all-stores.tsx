import { useCallback } from 'react'
import { useBudgetStore } from '../budget/store'
import { useCategoryStore } from '../category/store'
import { useTransactionStore } from '../transaction/store'
import { useWalletStore } from '../wallet/store'

export const useResetAllStores = () => {
  const resetBudgetStore = useBudgetStore((state) => state._reset)
  const resetCategoryStore = useCategoryStore((state) => state._reset)
  const resetTransactionStore = useTransactionStore((state) => state._reset)
  const resetWalletStore = useWalletStore((state) => state._reset)

  const resetAllStores = useCallback(() => {
    resetBudgetStore()
    resetCategoryStore()
    resetTransactionStore()
    resetWalletStore()
  }, [
    resetBudgetStore,
    resetCategoryStore,
    resetTransactionStore,
    resetWalletStore,
  ])

  return resetAllStores
}
