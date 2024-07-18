import { getHonoClient } from '@/lib/client'
import { BudgetPeriodConfigSchema, BudgetSchema } from '@6pm/validation'
import { createQueryKeys } from '@lukemorales/query-key-factory'
import Decimal from 'decimal.js'
import { z } from 'zod'
import type { BudgetItem } from './store'

export const budgetQueries = createQueryKeys('budgets', {
  all: ({
    setBudgetsState,
  }: { setBudgetsState: (budgets: BudgetItem[]) => void }) => ({
    queryKey: [{}],
    queryFn: async () => {
      const hc = await getHonoClient()
      const res = await hc.v1.budgets.$get({
        query: {},
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }

      try {
        const items = await res.json()
        const budgets = items.map((item) =>
          BudgetSchema.extend({
            id: z.string().cuid2(),
            periodConfigs: z.array(
              BudgetPeriodConfigSchema.extend({
                id: z.string().cuid2(),
                amount: z.instanceof(Decimal, {
                  message:
                    "Field 'amount' must be a Decimal. Location: ['Models', 'BudgetPeriodConfig']",
                }),
              }),
            ),
          }).parse({
            ...item,
            periodConfigs: item?.periodConfigs?.map((pc) => ({
              ...pc,
              amount: new Decimal(Number(pc.amount)),
            })),
          }),
        )
        setBudgetsState(budgets)
        return budgets
      } catch (error) {
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(error)
      }
    },
  }),
})
