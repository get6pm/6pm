import { TransactionForm } from '@/components/transaction/transaction-form'
import { deleteTransaction, updateTransaction } from '@/mutations/transaction'
import { transactionQueries, useTransactionDetail } from '@/queries/transaction'
import { walletQueries } from '@/queries/wallet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { LoaderIcon } from 'lucide-react-native'
import { Alert, View } from 'react-native'

export default function EditRecordScreen() {
  const { i18n } = useLingui()
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>()
  const { data: transaction } = useTransactionDetail(transactionId!)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { mutateAsync } = useMutation({
    mutationFn: updateTransaction,
    onError(error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert(error.message)
    },
    onSuccess() {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
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
  const { mutateAsync: mutateDelete } = useMutation({
    mutationFn: deleteTransaction,
    onMutate() {
      router.back()
    },
    onError(error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert(error.message)
    },
    onSuccess() {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    },
    async onSettled() {
      await queryClient.invalidateQueries({
        queryKey: transactionQueries.all,
      })
      await queryClient.invalidateQueries({
        queryKey: walletQueries.list._def,
      })
    },
    throwOnError: true,
  })

  function handleDelete() {
    Haptics.selectionAsync()
    Alert.alert(
      t(
        i18n,
      )`This will delete the transaction. Are you sure you want to continue?`,
      '',
      [
        {
          text: t(i18n)`Cancel`,
          style: 'cancel',
        },
        {
          text: t(i18n)`Delete`,
          style: 'destructive',
          onPress: () => mutateDelete(transactionId!),
        },
      ],
    )
  }

  if (!transaction) {
    return (
      <View className="flex-1 items-center bg-muted justify-center">
        <LoaderIcon className="size-7 animate-spin text-primary" />
      </View>
    )
  }

  return (
    <TransactionForm
      onSubmit={(values) => mutateAsync({ id: transaction.id, data: values })}
      onCancel={router.back}
      defaultValues={{
        walletAccountId: transaction.walletAccountId,
        currency: transaction.currency,
        amount: Math.abs(transaction.amount),
        date: transaction.date,
        note: transaction.note ?? '',
        budgetId: transaction.budgetId ?? undefined,
        categoryId: transaction.categoryId ?? undefined,
      }}
      onDelete={handleDelete}
    />
  )
}
