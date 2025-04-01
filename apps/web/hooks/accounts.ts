import { useAppContext } from '@/store/app-provider'

export const useSpaceAccounts = (spaceId: string) => {
  const { spaces } = useAppContext((state) => ({
    spaces: state.spaces,
  }))

  const space = spaces[spaceId]

  if (!space) {
    return {}
  }

  return space.accounts
}

export const useSpaceAccountList = (spaceId: string) => {
  const accounts = useSpaceAccounts(spaceId)
  return Object.values(accounts)
}
