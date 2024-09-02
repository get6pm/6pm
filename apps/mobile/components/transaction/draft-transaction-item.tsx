import { TRANSACTION_ICONS } from '@/lib/icons/category-icons'
import { getAITransactionData } from '@/mutations/transaction'
import { useCategoryList } from '@/stores/category/hooks'
import { useTransactionStore } from '@/stores/transaction/store'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useMutation, useMutationState } from '@tanstack/react-query'
import { Link } from 'expo-router'
import { CircleAlert } from 'lucide-react-native'
import type { FC } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, View } from 'react-native'
import { AmountFormat } from '../common/amount-format'
import GenericIcon from '../common/generic-icon'
import { toast } from '../common/toast'
import { Text } from '../ui/text'

type DraftTransactionItemProps = {
  transactionId: string
}

export const DraftTransactionItem: FC<DraftTransactionItemProps> = ({
  transactionId,
}) => {
  const { i18n } = useLingui()
  const { draftTransactions } = useTransactionStore()
  const { categoriesDict } = useCategoryList()
  const transaction = draftTransactions.find((t) => t.id === transactionId)
  const mutationState = useMutationState({
    filters: {
      mutationKey: ['ai-transaction'],
    },
    select: (state) => state,
  })
  const { updateDraftTransaction, removeDraftTransaction } =
    useTransactionStore()

  const { mutateAsync: mutateRetry } = useMutation({
    mutationKey: ['ai-transaction'],
    mutationFn: getAITransactionData,
    onError(error) {
      toast.error(error.message ?? t(i18n)`Cannot extract transaction`)
    },
    onSuccess(result) {
      if (!result.amount) {
        throw new Error(t(i18n)`Cannot extract transaction`)
      }
      updateDraftTransaction({
        ...result,
        id: transactionId,
      })
    },
  })

  function handlePressError() {
    Alert.alert('', t(i18n)`Something went wrong. Please try again.`, [
      {
        text: t(i18n)`Retry`,
        style: 'cancel',
        onPress: () =>
          mutateRetry({
            id: transactionId,
            fileUri: transaction?.imageUri ?? '',
          }),
      },
      {
        text: t(i18n)`Delete`,
        style: 'destructive',
        onPress: () => removeDraftTransaction(transactionId),
      },
    ])
  }

  const latestState = mutationState?.findLast(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (s) => (s?.state?.variables as any)?.id === transactionId,
  )
  if (!transaction) {
    return null
  }
  const { categoryId } = transaction
  const category = (categoryId && categoriesDict[categoryId]) || null

  const iconName =
    TRANSACTION_ICONS[transaction.note!] || category?.icon || 'Sparkles'

  const transactionName =
    t(i18n)`${transaction.note}` || category?.name || t(i18n)`Uncategorized`

  if (latestState?.state?.status === 'pending') {
    return (
      <Pressable
        className="flex h-14 flex-row items-center justify-between gap-4 px-6 active:bg-muted"
        onPress={() => {
          Alert.alert('', t(i18n)`Transaction is processing...`, [
            {
              text: t(i18n)`Stop`,
              style: 'destructive',
              onPress: () => {
                removeDraftTransaction(transactionId)
                latestState.destroy()
              },
            },
            {
              text: t(i18n)`Understood`,
            },
          ])
        }}
      >
        <View className="line-clamp-1 flex flex-1 flex-row items-center gap-6">
          <ActivityIndicator size="small" color="foreground" />
          <Text numberOfLines={1} className="flex-1">
            {t(i18n)`Processing...`}
          </Text>
        </View>
        <Image
          source={{ uri: transaction.imageUri! }}
          className="size-6 rounded-md border-2 border-border bg-muted"
        />
      </Pressable>
    )
  }

  if (latestState?.state?.status === 'error' || !transaction.amount) {
    return (
      <Pressable
        onPress={handlePressError}
        className="flex h-14 flex-row items-center justify-between gap-4 bg-destructive/5 px-6 active:bg-destructive/10"
      >
        <View className="line-clamp-1 flex flex-1 flex-row items-center gap-6">
          <CircleAlert className="size-5 text-destructive" />
          <Text numberOfLines={1} className="flex-1">
            {latestState?.state?.failureReason?.message ??
              t(i18n)`Cannot process image`}
          </Text>
        </View>
        <Image
          source={{ uri: transaction.imageUri! }}
          className="size-6 rounded-md border-2 border-border bg-muted"
        />
      </Pressable>
    )
  }

  return (
    <Link
      asChild
      push
      href={{
        pathname: '/transaction/new-record',
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        params: transaction as any,
      }}
    >
      <Pressable className="flex h-14 flex-row items-center justify-between gap-4 bg-muted/50 px-6 active:bg-muted">
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
        />
      </Pressable>
    </Link>
  )
}
