import { getHonoClient } from '@/lib/client'
import { useMeQuery } from '@/queries/auth'
import type { WalletFormValues } from '@6pm/validation'
import { createId } from '@paralleldrive/cuid2'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'lodash-es'
import { useMemo } from 'react'
import type { StoreHookQueryOptions } from '../core/stores'
import { useCreateTransaction } from '../transaction/hooks'
import { walletQueries } from './queries'
import { useWalletStore } from './store'

export const useWalletListQueryOptions = (
  queryOptions?: StoreHookQueryOptions,
) => {
  const wallets = useWalletStore().wallets
  const setWalletsState = useWalletStore((state) => state.setWallets)
  return {
    ...walletQueries.all({ setWalletsState }),
    initialData: wallets?.length > 0 ? wallets : undefined,
    ...queryOptions,
  }
}

export const useWalletList = (queryOptions?: StoreHookQueryOptions) => {
  const wallets = useWalletStore().wallets
  const queryOpts = useWalletListQueryOptions(queryOptions)

  const query = useQuery(queryOpts)

  const walletsDict = useMemo(() => keyBy(wallets, 'id'), [wallets])

  return {
    ...query,
    wallets,
    walletsDict,
  }
}

export const useWallet = (walletId: string) => {
  const wallets = useWalletStore().wallets
  const wallet = useMemo(
    () => wallets.find((wallet) => wallet.id === walletId) || null,
    [wallets, walletId],
  )

  return { wallet }
}

export const useUpdateWallet = () => {
  const updateWalletInStore = useWalletStore((state) => state.updateWallet)
  const { walletsDict } = useWalletList()
  const { mutateAsync: mutateCreateTransaction } = useCreateTransaction()
  const queryClient = useQueryClient()

  const mutation = useMutation(
    {
      mutationFn: async ({
        id: walletId,
        data,
      }: {
        id: string
        data: WalletFormValues
      }) => {
        const { balance, ...walletData } = data
        const hc = await getHonoClient()
        const wallet = walletsDict[walletId]

        if (!wallet) {
          return
        }

        // Update wallet info and create adjust balance transaction
        const promises = [
          hc.v1.wallets[':walletId'].$put({
            param: { walletId },
            json: walletData,
          }),
        ]

        if (balance) {
          promises.push(
            mutateCreateTransaction({
              id: createId(),
              data: {
                amount: balance ?? 0,
                walletAccountId: wallet.id,
                currency: wallet.preferredCurrency,
                date: new Date(),
                note: 'Adjust balance',
              },
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            }) as any,
          )
        }

        const [result] = await Promise.all(promises)

        return result
      },
      onMutate: async ({ id, data: { balance, ...data } }) => {
        let wallet = walletsDict[id]
        if (!wallet) {
          return
        }

        const newBallance = (balance ?? 0) + (wallet.balance ?? 0)

        wallet = {
          ...wallet,
          ...data,
          balance: newBallance,
          updatedAt: new Date(),
        }

        updateWalletInStore(wallet)

        return wallet
      },
    },
    queryClient,
  )

  return mutation
}

export const useCreateWallet = () => {
  const { data: userData } = useMeQuery()
  const updateWalletInStore = useWalletStore((state) => state.updateWallet)

  const mutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: WalletFormValues
    }) => {
      const { balance, ...walletData } = data
      const hc = await getHonoClient()

      const [result] = await Promise.all([
        hc.v1.wallets.$post({
          json: walletData,
        }),
        balance
          ? hc.v1.transactions.$post({
              json: {
                amount: balance,
                walletAccountId: id,
                currency: walletData.preferredCurrency,
                date: new Date(),
                note: 'Initial balance',
              },
            })
          : Promise.resolve(),
      ])

      if (!result.ok) {
        throw result
      }

      return result
    },
    onMutate({ id, data }) {
      const wallet = {
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        balance: data.balance ?? 0,
        userId: userData?.id || '',
        description: null,
        icon: null,
        lastDigits: null,
        ...data,
      }

      updateWalletInStore(wallet)

      return wallet
    },
  })

  return mutation
}

export const useDeleteWallet = () => {
  const removeWalletInStore = useWalletStore((state) => state.removeWallet)

  const mutation = useMutation({
    mutationFn: async (walletId: string) => {
      const hc = await getHonoClient()
      await hc.v1.wallets[':walletId'].$delete({
        param: { walletId },
      })
    },
    onMutate(walletId) {
      removeWalletInStore(walletId)
    },
  })

  return mutation
}
