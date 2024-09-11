import { useQuery } from '@tanstack/react-query'
import * as Updates from 'expo-updates'

export function useOTAUpdates() {
  const { isLoading, refetch } = useQuery({
    queryKey: ['updates'],
    queryFn: async () => {
      await Updates.fetchUpdateAsync()
      await Updates.reloadAsync()
    },
    enabled: false,
  })

  async function checkForUpdate() {
    return await Updates.checkForUpdateAsync()
  }

  return {
    checkForUpdate,
    startUpdate: refetch,
    updating: isLoading,
  }
}
