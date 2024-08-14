import { AccountForm } from '@/components/wallet/account-form'
import { createWallet } from '@/mutations/wallet'
import { walletQueries } from '@/queries/wallet'
import { WalletBalanceState } from '@6pm/validation'
import { PortalHost, useModalPortalRoot } from '@rn-primitives/portal'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Alert, ScrollView, View } from 'react-native'

export default function NewAccountScreen() {
  const queryClient = useQueryClient()
  const { sideOffset, ...rootProps } = useModalPortalRoot()
  const router = useRouter()
  const { mutateAsync } = useMutation({
    mutationFn: createWallet,
    async onMutate(newWallet) {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: walletQueries.list().queryKey,
      })
      // Snapshot the previous value
      const previousWallets = queryClient.getQueryData(
        walletQueries.list().queryKey,
      )
      // Optimistically update to the new value
      queryClient.setQueryData(walletQueries.list().queryKey, (old = []) => [
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        ...(old as any),
        newWallet,
      ])
      // Return a context object with the snapshotted value
      return { previousWallets }
    },
    onError(error, _, context) {
      Alert.alert(error.message)
      // use the context returned from onMutate to rollback
      queryClient.setQueryData(
        walletQueries.list().queryKey,
        context?.previousWallets,
      )
    },
    onSuccess() {
      router.back()
    },
    async onSettled() {
      // Always refetch after error or success:
      await queryClient.invalidateQueries({
        queryKey: walletQueries._def,
      })
    },
    throwOnError: true,
  })

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
            mutateAsync({
              ...data,
              balance: statedBalance,
            })
          }}
          sideOffset={sideOffset}
        />
      </ScrollView>
      <PortalHost name="account-form" />
    </View>
  )
}
