import { TransactionForm } from '@/components/transaction/transaction-form'
import { useWallets } from '@/queries/wallet'
import { useRouter } from 'expo-router'
import { LoaderIcon } from 'lucide-react-native'
import { View } from 'react-native'

export default function NewRecordScreen() {
  const router = useRouter()
  const { data: walletAccounts } = useWallets()

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
      onSubmit={(values) => console.log('submit', values)}
      onCancel={router.back}
      defaultValues={{
        walletAccountId: defaultWallet.id,
        currency: defaultWallet.preferredCurrency ?? 'USD',
      }}
    />
  )
}
