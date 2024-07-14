import { TransactionForm } from '@/components/transaction/transaction-form'
import { createTransaction } from '@/mutations/transaction'
import { transactionQueries } from '@/queries/transaction'
import { useWallets, walletQueries } from '@/queries/wallet'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { LoaderIcon } from 'lucide-react-native'
import { Alert, View } from 'react-native'

export default function NewRecordScreen() {
  const router = useRouter()
  const { data: walletAccounts } = useWallets()
  // const { i18n } = useLingui()
  const queryClient = useQueryClient()
  const { mutateAsync } = useMutation({
    mutationFn: createTransaction,
    onError(error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert(error.message)
    },
    onSuccess() {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
      // toast.success(t(i18n)`Transaction created`)
    },
    async onSettled() {
      await queryClient.invalidateQueries({
        queryKey: transactionQueries.all,
      })
      await queryClient.invalidateQueries({
        queryKey: walletQueries.list._def,
      })
    },
  })

  const defaultWallet = walletAccounts?.[0]

  if (!defaultWallet) {
    return (
      <View className="flex-1 items-center bg-muted justify-center">
        <LoaderIcon className="size-7 animate-spin text-primary" />
      </View>
    )
  }

  return (
    <TransactionForm
      onSubmit={mutateAsync}
      onCancel={router.back}
      defaultValues={{
        walletAccountId: defaultWallet.id,
        currency: defaultWallet.preferredCurrency ?? 'USD',
      }}
    />
  )
}
