import { AccountForm } from '@/components/wallet/account-form'
import { createWallet } from '@/mutations/wallet'
import { walletQueries } from '@/queries/wallet'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Alert, ScrollView } from 'react-native'

export default function NewAccountScreen() {
  const queryClient = useQueryClient()
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
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      queryClient.setQueryData(walletQueries.list().queryKey, (old: any) => [
        ...old,
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
    <ScrollView
      className="bg-card flex-1"
      contentContainerClassName="gap-4 p-6"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <AccountForm onSubmit={mutateAsync} />
    </ScrollView>
  )
}
