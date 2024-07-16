import { TRANSACTION_ICONS } from '@/lib/icons/category-icons'
import { cn } from '@/lib/utils'
import type { TransactionPopulated } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link } from 'expo-router'
import { type FC, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import GenericIcon from '../common/generic-icon'
import { Text } from '../ui/text'

type TransactionItemProps = {
  transaction: TransactionPopulated
}

export const TransactionItem: FC<TransactionItemProps> = ({ transaction }) => {
  const { i18n } = useLingui()

  const iconName = useMemo(() => {
    return (
      TRANSACTION_ICONS[transaction.note!] ||
      transaction?.category?.icon ||
      'Shapes'
    )
  }, [transaction])

  const transactionName = useMemo(() => {
    return (
      t(i18n)`${transaction.note}` ||
      transaction?.category?.name ||
      t(i18n)`Uncategorized`
    )
  }, [transaction, i18n])

  return (
    <Link
      asChild
      push
      href={{
        pathname: '/transaction/[transactionId]',
        params: { transactionId: transaction.id },
      }}
    >
      <Pressable className="flex flex-row items-center gap-4 px-6 justify-between h-14 active:bg-muted">
        <View className="flex flex-row items-center gap-6 flex-1 line-clamp-1">
          <GenericIcon
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            name={iconName as any}
            className="size-5 text-foreground"
          />
          <Text numberOfLines={1} className="flex-1">
            {transactionName}
          </Text>
        </View>
        <Text
          className={cn(
            'font-semibold shrink-0',
            transaction.amount > 0 && 'text-amount-positive',
            transaction.amount < 0 && 'text-amount-negative',
          )}
        >
          {Math.abs(transaction.amount).toLocaleString()}{' '}
          <Text className="text-muted-foreground text-[10px] font-normal">
            {transaction.currency}
          </Text>
        </Text>
      </Pressable>
    </Link>
  )
}
