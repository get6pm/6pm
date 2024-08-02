import { getHonoClient } from '@/lib/client'
import { type BudgetFormValues, BudgetSchema } from '@6pm/validation'
import { createId } from '@paralleldrive/cuid2'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Decimal from 'decimal.js'
import { first, keyBy, orderBy } from 'lodash-es'
import { useMemo } from 'react'
import { z } from 'zod'
import { budgetQueries } from './queries'
import { type BudgetItem, useBudgetStore } from './store'

export const useBudgetList = () => {
  const budgets = useBudgetStore().budgets
  const setBudgetsState = useBudgetStore((state) => state.setBudgets)

  const query = useQuery({
    ...budgetQueries.all({ setBudgetsState }),
    initialData: budgets.length > 0 ? budgets : undefined,
  })

  const {
    budgetsDict,
    spendingBudgets,
    savingBudgets,
    investingBudgets,
    debtBudgets,
    totalBudget,
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

    const totalBudget = budgets.reduce(
      (acc, budget) => acc.add(new Decimal(budget.periodConfigs[0].amount)),
      new Decimal(0),
    )

    return {
      budgetsDict,
      spendingBudgets,
      savingBudgets,
      investingBudgets,
      debtBudgets,
      totalBudget,
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
    totalBudget,
  }
}

export const useBudget = (budgetId: string) => {
  const budgets = useBudgetStore().budgets
  const budget: BudgetItem | null = useMemo(
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

        const latestPeriodConfig = first(
          orderBy(budget.periodConfigs, 'startDate', 'desc'),
        )

        budget = {
          ...budget,
          ...data,
          updatedAt: new Date(),
          periodConfigs: budget.periodConfigs.map((pc) =>
            pc.id === latestPeriodConfig?.id
              ? {
                  ...latestPeriodConfig,
                  ...data.period,
                  amount:
                    new Decimal(data.period.amount) ??
                    latestPeriodConfig.amount,
                }
              : pc,
          ),
        }

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
      const period: BudgetItem['periodConfigs'][number] = {
        ...data.period,
        id: data.period.id ?? createId(),
        budgetId: id!,
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: new Decimal(data.period.amount),
        startDate: data.period.startDate
          ? new Date(data.period.startDate)
          : null,
        endDate: data.period.endDate ? new Date(data.period.endDate) : null,
      }

      const budget: BudgetItem = {
        id: id!,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
        periodConfigs: [period],
        ...data,
      }

      updateBudgetInStore(budget)

      return budget
    },
  })

  return mutation
}
