import type { AccountValues } from '@/schemas/account'
import { useAppContext } from '@/store/app-provider'
import { useState } from 'react'
import { useSpace } from './spaces'

export const useCategories = () => {
  const space = useSpace()
  const { categories } = useAppContext((state) => ({
    categories: state.spaces[space.id]?.categories,
  }))
  return categories ?? {}
}

export const useAccountList = ({
  includeDeleted,
}: { includeDeleted?: boolean }) => {
  const categories = useCategories()
  const accountList = Object.values(categories)

  if (!includeDeleted) {
    return accountList.filter((account) => !account.deletedAt)
  }

  return accountList
}

export const useAccount = (accountId: string) => {
  const categories = useCategories()
  return categories[accountId] ?? null
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

    try {
      const { spaceId, data } = args
      const result = await createAccountAction({ spaceId, data })
      return result
    } catch (error) {
      console.error('Failed to create account', error)
    } finally {
      setIsPending(false)
    }
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
