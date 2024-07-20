import { toast } from '@/components/common/toast'
import { Scanner } from '@/components/transaction/scanner'
import { TransactionForm } from '@/components/transaction/transaction-form'
import { createTransaction } from '@/mutations/transaction'
import { transactionQueries } from '@/queries/transaction'
import { useWallets, walletQueries } from '@/queries/wallet'
import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import {
  type TransactionFormValues,
  zTransactionFormValues,
  zUpdateTransaction,
} from '@6pm/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { LoaderIcon } from 'lucide-react-native'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, View } from 'react-native'
import PagerView from 'react-native-pager-view'

export default function NewRecordScreen() {
  const { i18n } = useLingui()
  const ref = useRef<PagerView>(null)
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data: walletAccounts } = useWallets()
  const defaultCurrency = useDefaultCurrency()
  const defaultWallet = walletAccounts?.[0]

  const params = useLocalSearchParams()
  const parsedParams = zUpdateTransaction.parse(params)
  const defaultValues = {
    date: new Date(),
    amount: 0,
    currency: defaultCurrency,
    note: '',
    walletAccountId: defaultWallet?.id,
    ...parsedParams,
  }

  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(zTransactionFormValues),
    defaultValues,
  })

  const { mutateAsync } = useMutation({
    mutationFn: createTransaction,
    onError(error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert(error.message)
    },
    onSuccess() {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
      toast.success(t(i18n)`Transaction created`)
    },
    async onSettled() {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: transactionQueries.all,
        }),
        queryClient.invalidateQueries({
          queryKey: walletQueries.list._def,
        }),
      ])
    },
  })

  if (!defaultWallet) {
    return (
      <View className="flex-1 items-center bg-muted justify-center">
        <LoaderIcon className="size-7 animate-spin text-primary" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-card">
      <PagerView
        ref={ref}
        overdrag={false}
        orientation="vertical"
        initialPage={0}
        style={{ flex: 1 }}
      >
        <TransactionForm
          form={transactionForm}
          onSubmit={mutateAsync}
          onCancel={router.back}
          onOpenScanner={() => {
            ref.current?.setPage(1)
          }}
        />
        <Scanner
          onScanStart={() => ref.current?.setScrollEnabled(false)}
          onScanResult={(result) => {
            transactionForm.reset(
              {
                ...defaultValues,
                ...result,
              },
              {
                keepDefaultValues: false,
              },
            )
            ref.current?.setScrollEnabled(true)
            ref.current?.setPage(0)
          }}
        />
      </PagerView>
    </View>
  )
}
