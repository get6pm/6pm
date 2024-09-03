import { getHonoClient } from '@/lib/client'
import {
  calculateBudgetPeriodStartEndDates,
  dayjsExtended,
} from '@6pm/utilities'
import {
  type BudgetFormValues,
  type BudgetPeriodConfig,
  BudgetSchema,
} from '@6pm/validation'
import { createId } from '@paralleldrive/cuid2'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Decimal from 'decimal.js'
import { first, keyBy, orderBy } from 'lodash-es'
import { useMemo } from 'react'
import { Alert } from 'react-native'
import { z } from 'zod'
import { useExchangeRate } from '../exchange-rates/hooks'
import { useTransactionList } from '../transaction/hooks'
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

    // TODO: Correct this with exchange rate
    const totalBudget = budgets.reduce((acc, budget) => {
      const latestPeriodConfig = first(
        orderBy(budget.periodConfigs, 'startDate', 'desc'),
      )
      if (!latestPeriodConfig) {
        return acc
      }
      return acc.add(new Decimal(latestPeriodConfig.amount))
    }, new Decimal(0))

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
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          json: data as any,
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
                    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                    data.period.amount ?? (latestPeriodConfig.amount as any),
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
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        json: { id, ...data } as any,
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
      const periodConfig = calculateBudgetPeriodStartEndDates({
        anchorDate: new Date(),
        type: data.period.type,
      })

      const period: BudgetItem['periodConfigs'][number] = {
        ...data.period,
        id: data.period.id ?? createId(),
        budgetId: id!,
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: new Decimal(data.period.amount!),
        startDate: data.period.startDate ?? periodConfig.startDate,
        endDate: data.period.endDate ?? periodConfig.endDate,
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

export function useDeleteBudget() {
  const removeBudgetInStore = useBudgetStore((state) => state.removeBudget)

  const mutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const hc = await getHonoClient()
      await hc.v1.budgets[':budgetId'].$delete({
        param: { budgetId },
      })
    },
    onMutate(budgetId) {
      removeBudgetInStore(budgetId)
    },
    onError(error) {
      Alert.alert(error.message)
    },
    throwOnError: true,
  })

  return mutation
}

export function getLatestPeriodConfig(periodConfigs: BudgetPeriodConfig[]) {
  return first(orderBy(periodConfigs, 'startDate', 'desc'))
}

export function useBudgetPeriodStats(
  periodConfig: BudgetPeriodConfig,
  currency: string,
) {
  const { exchangeRate: exchangeToBudgetCurrency } = useExchangeRate({
    fromCurrency: 'VND',
    toCurrency: currency,
  })

  // in budget currency
  const budgetAmount = useMemo(() => {
    if (periodConfig?.amount instanceof Decimal) {
      return periodConfig?.amount
    }

    return new Decimal(periodConfig?.amount ?? 0)
  }, [periodConfig])

  const { transactions, totalExpense, totalIncome } = useTransactionList({
    from: new Date(periodConfig?.startDate!),
    to: new Date(periodConfig?.endDate!),
    budgetId: periodConfig.budgetId,
  })

  const totalBudgetUsage = new Decimal(totalExpense)
    .plus(totalIncome)
    .abs()
    .mul(exchangeToBudgetCurrency?.rate ?? 1)

  const remainingAmount = budgetAmount.sub(totalBudgetUsage)

  const usagePercentage = totalBudgetUsage
    .div(budgetAmount!)
    .mul(100)
    .toNumber()

  const averageAmountPerDay = budgetAmount.div(
    dayjsExtended(periodConfig?.endDate!).diff(
      dayjsExtended(periodConfig?.startDate!),
      'day',
    ),
  )

  const remainingDays = dayjsExtended(periodConfig?.endDate!).diff(
    dayjsExtended(),
    'day',
  )

  const remainingAmountPerDays = remainingAmount?.div(
    remainingDays > 0 ? remainingDays : 1,
  )

  const isExceeded = remainingAmountPerDays?.lt(averageAmountPerDay!)

  return {
    budgetAmount,
    transactions,
    totalBudgetUsage,
    usagePercentage,
    remainingAmount,
    remainingDays: remainingDays > 0 ? remainingDays : 1,
    remainingAmountPerDays,
    averageAmountPerDay,
    isExceeded,
  }
}
