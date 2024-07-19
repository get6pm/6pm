import { BudgetPeriodType } from '@prisma/client'
import { dayjsExtended } from './dayjs'

/**
 * Given an anchor date and period type,
 * calculate the start and end dates of the budget period.
 * Example:
 * - anchorDate: 2022-01-15
 * - periodType: MONTHLY
 * - startDate: 2022-01-01
 * - endDate: 2022-01-31
 */
export function calculateBudgetPeriodStartEndDates({
  anchorDate,
  type,
}: {
  anchorDate: Date
  type: BudgetPeriodType
}) {
  switch (type) {
    case BudgetPeriodType.WEEKLY:
      return {
        startDate: dayjsExtended(anchorDate).startOf('week').toDate(),
        endDate: dayjsExtended(anchorDate).endOf('week').toDate(),
      }
    case BudgetPeriodType.MONTHLY:
      return {
        startDate: dayjsExtended(anchorDate).startOf('month').toDate(),
        endDate: dayjsExtended(anchorDate).endOf('month').toDate(),
      }
    case BudgetPeriodType.QUARTERLY:
      return {
        startDate: dayjsExtended(anchorDate).startOf('quarter').toDate(),
        endDate: dayjsExtended(anchorDate).endOf('quarter').toDate(),
      }
    case BudgetPeriodType.YEARLY:
      return {
        startDate: dayjsExtended(anchorDate).startOf('year').toDate(),
        endDate: dayjsExtended(anchorDate).endOf('year').toDate(),
      }
    default:
      return {
        startDate: null,
        endDate: null,
      }
  }
}
