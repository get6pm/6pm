import { Button } from '@/components/ui/button'
import { AccountForm } from '@/components/wallet/account-form'
import {
  useDeleteWallet,
  useUpdateWallet,
  useWallet,
} from '@/stores/wallet/hooks'
import { WalletBalanceState, type WalletFormValues } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { PortalHost, useModalPortalRoot } from '@rn-primitives/portal'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { Trash2Icon } from 'lucide-react-native'
import { useEffect } from 'react'
import { Alert, ScrollView, View } from 'react-native'

export default function EditAccountScreen() {
  const { walletId } = useLocalSearchParams()
  const { sideOffset, ...rootProps } = useModalPortalRoot()
  const { i18n } = useLingui()
  const router = useRouter()
  const navigation = useNavigation()

  const { wallet } = useWallet(walletId as string)
  const { mutateAsync: mutateUpdate } = useUpdateWallet()
  const { mutateAsync: mutateDelete } = useDeleteWallet()

  const handleUpdateWallet = async ({ balance, ...data }: WalletFormValues) => {
    if (!wallet) {
      return
    }

    const statedBalance =
      data.balanceState === WalletBalanceState.Positive
        ? balance
        : (balance ?? 0) * -1
    const adjustedBalance =
      (statedBalance ?? 0) - ((wallet.balance as number) ?? 0)

    mutateUpdate({
      id: walletId as string,
      data: {
        ...data,
        balance: adjustedBalance,
      },
    }).catch((error) => {
      Alert.alert(error.message)
    })

    router.back()
  }

  const handleDeleteWallet = async () => {
    mutateDelete(walletId as string).catch((error) => {
      Alert.alert(error.message)
    })

    router.back()
  }

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
                  onPress: handleDeleteWallet,
                },
              ],
            )
          }
        >
          <Trash2Icon className="size-5 text-foreground" />
        </Button>
      ),
    })
  }, [])

  if (!wallet) {
    return null
  }

  return (
    <View className="flex-1 bg-background" {...rootProps}>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-4 p-6"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
      >
        <AccountForm
          onSubmit={handleUpdateWallet}
          defaultValues={{
            name: wallet.name,
            preferredCurrency: wallet.preferredCurrency,
            balance: wallet.balance,
            icon: wallet.icon ?? 'CreditCard',
            description: wallet.description ?? '',
            lastDigits: wallet.lastDigits ?? '',
          }}
          sideOffset={sideOffset}
        />
      </ScrollView>
      <PortalHost name="account-form" />
    </View>
  )
}
