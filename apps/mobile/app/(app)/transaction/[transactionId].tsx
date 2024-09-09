import { TransactionForm } from '@/components/transaction/transaction-form'
import { sleep } from '@/lib/utils'
import {
  useDeleteTransaction,
  useTransaction,
  useUpdateTransaction,
} from '@/stores/transaction/hooks'
import {
  type TransactionFormValues,
  zTransactionFormValues,
} from '@6pm/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { PortalHost, useModalPortalRoot } from '@rn-primitives/portal'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'
import { ActivityIndicator, Alert, View } from 'react-native'

export default function EditRecordScreen() {
  const { i18n } = useLingui()
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>()
  const { transaction } = useTransaction(transactionId!)
  const router = useRouter()
  const { mutateAsync: mutateUpdate } = useUpdateTransaction()
  const { mutateAsync: mutateDelete } = useDeleteTransaction()
  const { sideOffset, ...rootProps } = useModalPortalRoot()

  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(zTransactionFormValues),
    defaultValues: {
      walletAccountId: transaction?.walletAccountId,
      currency: transaction?.currency,
      amount: Math.abs(transaction?.amount ?? 0),
      date: transaction?.date,
      note: transaction?.note ?? '',
      budgetId: transaction?.budgetId,
      categoryId: transaction?.categoryId ?? undefined,
    },
  })

  const handleUpdate = async (values: TransactionFormValues) => {
    mutateUpdate({
      id: transactionId!,
      data: {
        ...values,
        amount: values.categoryId ? values.amount : -Math.abs(values.amount),
      },
    }).catch((error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert(
        (error instanceof Error && error.message) ||
          t(i18n)`An error occurred while updating the transaction`,
      )
    })

    await sleep(200)

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.back()
  }

  function handleDelete() {
    Haptics.selectionAsync()
    Alert.alert(
      t(i18n)`Are you sure?`,
      t(
        i18n,
      )`This will delete the transaction. Are you sure you want to continue?`,
      [
        {
          text: t(i18n)`Cancel`,
          style: 'cancel',
        },
        {
          text: t(i18n)`Delete`,
          style: 'destructive',
          onPress: async () => {
            mutateDelete(transactionId!).catch((error) => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
              Alert.alert(
                error.message ||
                  t(i18n)`An error occurred while deleting the transaction`,
              )
            })

            router.back()
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          },
        },
      ],
    )
  }

  if (!transaction) {
    return (
      <View className="flex-1 items-center justify-center bg-muted">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-card" {...rootProps}>
      <TransactionForm
        sideOffset={sideOffset}
        form={transactionForm}
        onSubmit={handleUpdate}
        onCancel={router.back}
        onDelete={handleDelete}
      />
      <PortalHost name="transaction-form" />
    </View>
  )
}
