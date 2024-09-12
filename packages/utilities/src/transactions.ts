export function getTransactionAmountBasedOnCategory(
  amount: number,
  categoryType?: 'INCOME' | 'EXPENSE' | null,
): number {
  if (!categoryType) {
    return amount
  }

  return categoryType === 'INCOME' ? Math.abs(amount) : -Math.abs(amount)
}
