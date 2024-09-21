import { TRANSACTION_ICONS } from '@/lib/icons/category-icons'
import { useCategoryList } from '@/stores/category/hooks'
import type { TransactionPopulated } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link } from 'expo-router'
import { LandPlotIcon } from 'lucide-react-native'
import { type FC, useMemo } from 'react'
import { Image, Pressable, View } from 'react-native'
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
      <Pressable className="flex flex-row items-center justify-between gap-4 px-6 py-3 active:bg-muted">
        <View className="h-12 w-12 items-center justify-center rounded-lg bg-secondary">
          <GenericIcon
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            name={iconName as any}
            className="size-6 text-secondary-foreground"
          />
          {!!transaction.blobAttachments?.length && (
            <Link
              className="-right-2 -bottom-2 absolute"
              href={{
                pathname: '/blob-viewer',
                params: {
                  blobObjectUrl: transaction.blobAttachments[0].url,
                },
              }}
            >
              <Image
                source={{ uri: transaction.blobAttachments[0].url }}
                className="size-6 rounded-md border-2 border-border bg-muted"
              />
            </Link>
          )}
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text numberOfLines={1} className="flex-1 font-semiBold text-lg">
              {transactionName}
            </Text>

            <AmountFormat
              amount={transaction.amount}
              currency={transaction.currency}
              className="text-lg"
              displayPositiveColor
            />
          </View>
          <View className="flex-row items-center gap-3 self-start">
            {transaction.walletAccount && (
              <View className="flex-row items-center gap-2">
                <GenericIcon
                  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                  name={transaction.walletAccount.icon as any}
                  className="size-4 text-muted-foreground"
                />
                <Text
                  numberOfLines={1}
                  className="text-muted-foreground text-sm"
                >
                  {transaction.walletAccount.name}
                </Text>
              </View>
            )}
            {transaction.budget && (
              <View className="flex-row items-center gap-2">
                <LandPlotIcon className="size-4 text-muted-foreground" />
                <Text
                  numberOfLines={1}
                  className="text-muted-foreground text-sm"
                >
                  {transaction.budget.name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  )
}
