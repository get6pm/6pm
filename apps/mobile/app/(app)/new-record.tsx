import { TransactionForm } from '@/components/transaction/transaction-form'
import { useWallets } from '@/queries/wallet'
import { useRouter } from 'expo-router'

export default function NewRecordScreen() {
  const router = useRouter()
  const { data: walletAccounts } = useWallets()

  return (
    <TransactionForm
      onSubmit={(values) => console.log('submit', values)}
      onCancel={router.back}
      defaultValues={{
        walletAccountId: walletAccounts?.[0].id,
        currency: walletAccounts?.[0].preferredCurrency,
      }}
    />
  )
}
