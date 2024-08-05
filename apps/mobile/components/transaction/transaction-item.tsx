import { TRANSACTION_ICONS } from '@/lib/icons/category-icons'
import { useCategoryList } from '@/stores/category/hooks'
import type { TransactionPopulated } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link } from 'expo-router'
import { type FC, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { AmountFormat } from '../common/amount-format'
import GenericIcon from '../common/generic-icon'
import { Text } from '../ui/text'

type TransactionItemProps = {
  transaction: TransactionPopulated
}

export const TransactionItem: FC<TransactionItemProps> = ({ transaction }) => {
  const { i18n } = useLingui()
  const { categoryId } = transaction
  const { categoriesDict } = useCategoryList()
  const category = (categoryId && categoriesDict[categoryId]) || null

  const iconName = useMemo(() => {
    return TRANSACTION_ICONS[transaction.note!] || category?.icon || 'Shapes'
  }, [category?.icon, transaction.note])

  const transactionName = useMemo(() => {
    return (
      t(i18n)`${transaction.note}` || category?.name || t(i18n)`Uncategorized`
    )
  }, [transaction.note, category?.name, i18n])

  return (
    <Link
      asChild
      push
      href={{
        pathname: '/transaction/[transactionId]',
        params: { transactionId: transaction.id },
      }}
    >
      <Pressable className="flex h-14 flex-row items-center justify-between gap-4 px-6 active:bg-muted">
        <View className="line-clamp-1 flex flex-1 flex-row items-center gap-6">
          <GenericIcon
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            name={iconName as any}
            className="size-5 text-foreground"
          />
          <Text numberOfLines={1} className="flex-1">
            {transactionName}
          </Text>
        </View>
        <AmountFormat
          amount={transaction.amount}
          currency={transaction.currency}
          className="font-semibold text-md"
          displayPositiveColor
        />
      </Pressable>
    </Link>
  )
}
