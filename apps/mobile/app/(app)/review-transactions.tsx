import { DraftTransactionItem } from '@/components/transaction/draft-transaction-item'
import { Text } from '@/components/ui/text'
import { useTransactionStore } from '@/stores/transaction/store'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { FlatList } from 'react-native'

export default function ReviewTransactionsScreen() {
  const { draftTransactions } = useTransactionStore()
  const { i18n } = useLingui()

  return (
    <FlatList
      className="bg-card"
      data={draftTransactions}
      renderItem={({ item }) => (
        <DraftTransactionItem transactionId={item.id} />
      )}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <Text className="m-6 mb-9 text-center font-sans text-muted-foreground">
          {t(i18n)`Your pending AI transactions will show up here`}
        </Text>
      }
    />
  )
}
