import type { AccountValues } from '@/schemas/account'
import { useAppContext } from '@/store/app-provider'
import { useState } from 'react'
import { useSpace } from './spaces'

export const useAccounts = () => {
  const space = useSpace()
  const { accounts } = useAppContext((state) => ({
    accounts: state.spaces[space.id]?.accounts,
  }))
  return accounts ?? {}
}

export const useAccountList = ({
  includeDeleted,
}: { includeDeleted?: boolean } = {}) => {
  const accounts = useAccounts()
  const accountList = Object.values(accounts)

  if (!includeDeleted) {
    return accountList.filter((account) => !account.deletedAt)
  }

  return accountList
}

export const useAccount = (accountId: string) => {
  const accounts = useAccounts()
  return accounts[accountId] ?? null
}

export const useCreateAccount = () => {
  const [isPending, setIsPending] = useState(false)

  const { createAccount: createAccountAction } = useAppContext((state) => ({
    createAccount: state.createAccount,
  }))

  const createAccount = async (args: {
    spaceId: string
    data: AccountValues
  }) => {
    setIsPending(true)
    const { spaceId, data } = args
    const result = await createAccountAction({ spaceId, data })
    setIsPending(false)
    return result
  }

  return { createAccount, isPending }
}

export const useUpdateAccount = () => {
  const [isPending, setIsPending] = useState(false)

  const { updateAccount: updateAccountAction } = useAppContext((state) => ({
    updateAccount: state.updateAccount,
  }))

  const updateAccount = async (args: {
    spaceId: string
    data: AccountValues
  }) => {
    setIsPending(true)

    try {
      const { spaceId, data } = args
      const result = await updateAccountAction({ spaceId, data })
      return result
    } catch (error) {
      console.error('Failed to update account', error)
    } finally {
      setIsPending(false)
    }
  }

  return { updateAccount, isPending }
}

export const useDeleteAccount = () => {
  const [isPending, setIsPending] = useState(false)

  const { deleteAccount: deleteAccountAction } = useAppContext((state) => ({
    deleteAccount: state.deleteAccount,
  }))

  const deleteAccount = async (args: {
    id: string
  }) => {
    setIsPending(true)

    try {
      const result = await deleteAccountAction({ id: args.id })
      return result
    } catch (error) {
      console.error('Failed to delete account', error)
    } finally {
      setIsPending(false)
    }
  }

  return { deleteAccount, isPending }
}
