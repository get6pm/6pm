import { Button } from '@/components/ui/button'
import { AccountForm } from '@/components/wallet/account-form'
import { deleteWallet, updateWallet } from '@/mutations/wallet'
import { transactionQueries } from '@/queries/transaction'
import { useWallets, walletQueries } from '@/queries/wallet'
import { WalletBalanceState } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { PortalHost, useModalPortalRoot } from '@rn-primitives/portal'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { Trash2Icon } from 'lucide-react-native'
import { useEffect } from 'react'
import { Alert, ScrollView, View } from 'react-native'

export default function EditAccountScreen() {
  const { walletId } = useLocalSearchParams()
  const { data: walletAccounts } = useWallets()
  const { sideOffset, ...rootProps } = useModalPortalRoot()
  const { i18n } = useLingui()
  const queryClient = useQueryClient()
  const router = useRouter()
  const navigation = useNavigation()
  const { mutateAsync: mutateUpdate } = useMutation({
    mutationFn: updateWallet,
    onError(error) {
      Alert.alert(error.message)
    },
    onSuccess() {
      router.back()
    },
    async onSettled() {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: walletQueries._def,
        }),
        queryClient.invalidateQueries({
          queryKey: transactionQueries.all,
        }),
      ])
    },
    throwOnError: true,
  })
  const { mutateAsync: mutateDelete } = useMutation({
    mutationFn: deleteWallet,
    onError(error) {
      Alert.alert(error.message)
    },
    onSuccess() {
      router.back()
    },
    async onSettled() {
      await queryClient.invalidateQueries({
        queryKey: walletQueries._def,
      })
    },
    throwOnError: true,
  })

  const walletAccount = walletAccounts?.find((w) => w.id === walletId)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          size="icon"
          variant="ghost"
          onPress={() =>
            Alert.alert(
              t(
                i18n,
              )`Delete wallet account will also delete all related transactions!`,
              '',
              [
                {
                  text: t(i18n)`Cancel`,
                  style: 'cancel',
                },
                {
                  text: t(i18n)`Delete`,
                  style: 'destructive',
                  onPress: () => mutateDelete(walletId as string),
                },
              ],
            )
          }
        >
          <Trash2Icon className="size-6 text-primary" />
        </Button>
      ),
    })
  }, [])

  if (!walletAccount) {
    return null
  }

  return (
    <View className="flex-1 bg-card" {...rootProps}>
      <ScrollView
        className="flex-1 bg-card"
        contentContainerClassName="gap-4 p-6"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
      >
        <AccountForm
          onSubmit={({ balance, ...data }) => {
            const statedBalance =
              data.balanceState === WalletBalanceState.Positive
                ? balance
                : (balance ?? 0) * -1
            const adjustedBalance =
              (statedBalance ?? 0) - ((walletAccount.balance as number) ?? 0)
            mutateUpdate({
              id: walletId as string,
              data: {
                ...data,
                balance: adjustedBalance,
              },
            })
          }}
          defaultValues={{
            name: walletAccount.name,
            preferredCurrency: walletAccount.preferredCurrency,
            balance: walletAccount.balance,
            icon: walletAccount.icon ?? 'CreditCard',
            description: walletAccount.description ?? '',
            lastDigits: walletAccount.lastDigits ?? '',
          }}
          sideOffset={sideOffset}
        />
      </ScrollView>
      <PortalHost name="account-form" />
    </View>
  )
}
