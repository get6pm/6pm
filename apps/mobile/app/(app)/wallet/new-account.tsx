import { AccountForm } from '@/components/wallet/account-form'
import { useCreateWallet } from '@/stores/wallet/hooks'
import { WalletBalanceState, type WalletFormValues } from '@6pm/validation'
import { createId } from '@paralleldrive/cuid2'
import { PortalHost, useModalPortalRoot } from '@rn-primitives/portal'
import { useRouter } from 'expo-router'
import { Alert, ScrollView, View } from 'react-native'

export default function NewAccountScreen() {
  const { sideOffset, ...rootProps } = useModalPortalRoot()
  const router = useRouter()
  const { mutateAsync: mutateCreate } = useCreateWallet()

  const handleCreate = async ({ balance, ...data }: WalletFormValues) => {
    const statedBalance =
      data.balanceState === WalletBalanceState.Positive
        ? balance
        : (balance ?? 0) * -1

    mutateCreate({
      id: createId(),
      data: {
        balance: statedBalance,
        ...data,
      },
    }).catch((error) => {
      Alert.alert(error.message)
    })

    router.back()
  }

  return (
    <View className="flex-1 bg-background" {...rootProps}>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-4 p-6"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
      >
        <AccountForm onSubmit={handleCreate} sideOffset={sideOffset} />
      </ScrollView>
      <PortalHost name="account-form" />
    </View>
  )
}
