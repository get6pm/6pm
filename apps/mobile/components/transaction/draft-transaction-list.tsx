import { useTransactionStore } from '@/stores/transaction/store'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { View } from 'react-native'
import { Badge } from '../ui/badge'
import { Text } from '../ui/text'
import { DraftTransactionItem } from './draft-transaction-item'

export function DraftTransactionList() {
  const { draftTransactions } = useTransactionStore()
  const { i18n } = useLingui()

  if (!draftTransactions.length) {
    return null
  }

  return (
    <View className="">
      <View className="mx-6 flex-row justify-between border-muted-foreground/20 border-b bg-card py-2 pt-4 align-center">
        <Text className="text-muted-foreground">{t(
          i18n,
        )`Waiting for review`}</Text>
        <Badge variant={draftTransactions.length ? 'default' : 'outline'}>
          <Text className="text-xs">{draftTransactions.length}</Text>
        </Badge>
      </View>
      {draftTransactions.map((item) => (
        <DraftTransactionItem key={item.id} transactionId={item.id} />
      ))}
    </View>
  )
}
