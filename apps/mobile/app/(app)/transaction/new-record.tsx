import { toast } from '@/components/common/toast'
import { Scanner } from '@/components/transaction/scanner'
import { TransactionForm } from '@/components/transaction/transaction-form'
import { useUserMetadata } from '@/hooks/use-user-metadata'
import { useWallets, walletQueries } from '@/queries/wallet'
import { useCreateTransaction } from '@/stores/transaction/hooks'
import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import {
  type TransactionFormValues,
  zTransactionFormValues,
  zUpdateTransaction,
} from '@6pm/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { createId } from '@paralleldrive/cuid2'
import { PortalHost, useModalPortalRoot } from '@rn-primitives/portal'
import { useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ActivityIndicator, Alert, View } from 'react-native'
import PagerView from 'react-native-pager-view'

export default function NewRecordScreen() {
  const { i18n } = useLingui()
  const ref = useRef<PagerView>(null)
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data: walletAccounts } = useWallets()
  const defaultCurrency = useDefaultCurrency()
  const defaultWallet = walletAccounts?.[0]
  const { sideOffset, ...rootProps } = useModalPortalRoot()
  const [page, setPage] = useState<number>(0)
  const { defaultBudgetId } = useUserMetadata()

  const params = useLocalSearchParams()
  const parsedParams = zUpdateTransaction.parse(params)
  const defaultValues = {
    date: new Date(),
    amount: 0,
    currency: defaultCurrency,
    note: '',
    walletAccountId: defaultWallet?.id,
    budgetId: defaultBudgetId as string,
    ...parsedParams,
  }

  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(zTransactionFormValues),
    defaultValues,
  })

  const { mutateAsync } = useCreateTransaction()

  const handleCreateTransaction = async (values: TransactionFormValues) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
      toast.success(t(i18n)`Transaction created`)

      await mutateAsync({ id: createId(), data: values })

      // TODO: remove this after the wallet store is implemented
      queryClient.invalidateQueries({
        queryKey: walletQueries.list._def,
      })
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    }
  }

  if (!defaultWallet) {
    return (
      <View className="flex-1 items-center justify-center bg-muted">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-card" {...rootProps}>
      <PagerView
        ref={ref}
        overdrag={false}
        orientation="vertical"
        initialPage={0}
        style={{ flex: 1 }}
        onPageSelected={({ nativeEvent }) => setPage(nativeEvent.position)}
        offscreenPageLimit={2}
      >
        <TransactionForm
          sideOffset={sideOffset}
          form={transactionForm}
          onSubmit={handleCreateTransaction}
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
          shouldRender={page === 1}
        />
      </PagerView>
      <PortalHost name="transaction-form" />
    </View>
  )
}
