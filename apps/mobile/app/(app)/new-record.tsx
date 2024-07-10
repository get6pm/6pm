import { toast } from '@/components/common/toast'
import { TransactionForm } from '@/components/transaction/transaction-form'
import { createTransaction } from '@/mutations/transaction'
import { useWallets } from '@/queries/wallet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { LoaderIcon } from 'lucide-react-native'
import { Alert, View } from 'react-native'

export default function NewRecordScreen() {
  const router = useRouter()
  const { data: walletAccounts } = useWallets()
  const { i18n } = useLingui()
  // const queryClient = useQueryClient()
  const { mutateAsync } = useMutation({
    mutationFn: createTransaction,
    onError(error) {
      Alert.alert(error.message)
    },
    onSuccess() {
      router.back()
      toast.success(t(i18n)`Transaction created`)
    },
    async onSettled() {
      // await queryClient.invalidateQueries({
      //   queryKey: transactionQueries.list._def,
      // })
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
