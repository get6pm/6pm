import { toast } from '@/components/common/toast'
import { sleep } from '@/lib/utils'
import { useWallets } from '@/queries/wallet'
import { useBudgetList } from '@/stores/budget/hooks'
import { useCategoryList } from '@/stores/category/hooks'
import { useCreateTransaction } from '@/stores/transaction/hooks'
import { dayjsExtended } from '@6pm/utilities'
import type { TransactionFormValues } from '@6pm/validation'
import { createId } from '@paralleldrive/cuid2'
import { sample } from 'lodash-es'
import { Alert } from 'react-native'

function getRandomInt(min: number, max: number) {
  const minValue = Math.ceil(min)
  const maxValue = Math.floor(max)
  return Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue
}

export function useSeed() {
  const { data: walletAccounts } = useWallets()
  const { data: budgets } = useBudgetList()
  const { categories = [] } = useCategoryList()
  const { mutateAsync } = useCreateTransaction()

  function generateTransaction(): TransactionFormValues {
    const id = createId()
    const walletAccountId = sample(walletAccounts)?.id!
    const budgetId = sample(budgets)?.id
    const categoryId = sample(categories)?.id
    const currency = sample(['VND', 'USD'])
    // amount: 10000 -> 2000000 for VND, 2 -> 1000 for USD
    const amount =
      currency === 'VND' ? getRandomInt(10000, 2000000) : getRandomInt(2, 1000)
    // date: random date in the past 4 months range
    const date = dayjsExtended()
      .subtract(getRandomInt(0, 30 * 4), 'day')
      .toDate()

    return {
      id,
      date,
      amount,
      currency,
      note: '',
      budgetId,
      walletAccountId,
      categoryId,
    }
  }

  function startSeed() {
    Alert.alert(
      '',
      'Seed 50 transactions in 4 months range for testing purposes. Please prepare wallets, categories, and budgets first.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start seeding',
          style: 'destructive',
          onPress: async () => {
            try {
              const loadingId = toast.loading(
                'Seeding, this may take a while...',
              )
              const transactions = Array.from(
                { length: 50 },
                generateTransaction,
              )
              await sleep(1000)
              await Promise.all(
                transactions.map(({ id, ...data }) =>
                  mutateAsync({
                    id: id!,
                    data,
                  }),
                ),
              )
              toast.dismiss(loadingId)
              toast.success('Transactions seeded successfully')
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            } catch (error: any) {
              toast.error(error?.message ?? 'Unknown error')
            }
          },
        },
      ],
    )
  }

  return { startSeed }
}
