import { getHonoClient } from '@/lib/client'
import { type BudgetPopulated, BudgetPopulatedSchema } from '@6pm/validation'
import { createQueryKeys } from '@lukemorales/query-key-factory'

export const budgetQueries = createQueryKeys('budgets', {
  all: ({
    setBudgetsState,
  }: { setBudgetsState: (budgets: BudgetPopulated[]) => void }) => ({
    queryKey: [{}],
    queryFn: async () => {
      const hc = await getHonoClient()
      const res = await hc.v1.budgets.$get({
        query: {},
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }

      const items = await res.json()
      const budgets = items.map((item) => BudgetPopulatedSchema.parse(item))
      setBudgetsState(budgets)

      return budgets
    },
  }),
})
