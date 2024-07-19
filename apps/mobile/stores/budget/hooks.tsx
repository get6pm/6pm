import { getHonoClient } from '@/lib/client'
import {
  type BudgetFormValues,
  BudgetSchema,
  type BudgetWithRelations,
} from '@6pm/validation'
import { createId } from '@paralleldrive/cuid2'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'lodash-es'
import { useMemo } from 'react'
import { z } from 'zod'
import { budgetQueries } from './queries'
import { useBudgetStore } from './store'

export const useBudgetList = () => {
  const budgets = useBudgetStore().budgets
  const setBudgetsState = useBudgetStore((state) => state.setBudgets)

  const query = useQuery({
    ...budgetQueries.all({ setBudgetsState }),
    initialData: budgets,
  })

  const {
    budgetsDict,
    spendingBudgets,
    savingBudgets,
    investingBudgets,
    debtBudgets,
  } = useMemo(() => {
    const budgetsDict = keyBy(budgets, 'id')
    const spendingBudgets = budgets.filter(
      (budget) => budget.type === 'SPENDING',
    )
    const savingBudgets = budgets.filter((budget) => budget.type === 'SAVING')
    const investingBudgets = budgets.filter(
      (budget) => budget.type === 'INVESTING',
    )
    const debtBudgets = budgets.filter((budget) => budget.type === 'DEBT')

    return {
      budgetsDict,
      spendingBudgets,
      savingBudgets,
      investingBudgets,
      debtBudgets,
    }
  }, [budgets])

  return {
    ...query,
    budgets,
    budgetsDict,
    spendingBudgets,
    savingBudgets,
    investingBudgets,
    debtBudgets,
  }
}

export const useBudget = (budgetId: string) => {
  const budgets = useBudgetStore().budgets
  const budget: BudgetWithRelations | null = useMemo(
    () => budgets.find((budget) => budget.id === budgetId) || null,
    [budgets, budgetId],
  )

  return { budget }
}

export const useUpdateBudget = () => {
  const updateBudgetInStore = useBudgetStore((state) => state.updateBudget)
  const { budgetsDict } = useBudgetList()
  const queryClient = useQueryClient()

  const mutation = useMutation(
    {
      mutationFn: async ({
        id,
        data,
      }: { id: string; data: BudgetFormValues }) => {
        const hc = await getHonoClient()
        const result = await hc.v1.budgets[':budgetId'].$put({
          param: { budgetId: id },
          json: data,
        })

        if (result.ok) {
          const budget = BudgetSchema.parse(await result.json())
          return budget
        }

        throw result
      },
      onMutate({ id, data }) {
        let budget = budgetsDict[id]
        if (!budget) {
          return
        }

        budget = { ...budget, ...data, updatedAt: new Date() }

        updateBudgetInStore(budget)

        return budget
      },
    },
    queryClient,
  )

  return mutation
}

export const useCreateBudget = () => {
  const updateBudgetInStore = useBudgetStore((state) => state.updateBudget)

  const mutation = useMutation({
    mutationFn: async ({
      id = createId(),
      data,
    }: { id?: string; data: BudgetFormValues }) => {
      const hc = await getHonoClient()
      const result = await hc.v1.budgets.$post({
        json: { id, ...data },
      })

      if (result.ok) {
        const json = await result.json()
        const budget = BudgetSchema.extend({
          id: z.string(),
        }).parse(json)
        return budget
      }

      throw result
    },
    onMutate({ id, data }) {
      const budget: BudgetWithRelations = {
        id: id!,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
        budgetUsers: [],
        invitations: [],
        transactions: [],
        ...data,
      }

      updateBudgetInStore(budget)

      return budget
    },
  })

  return mutation
}
