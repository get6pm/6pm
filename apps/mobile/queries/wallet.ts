import { getHonoClient } from '@/lib/client'
import { WalletAccountWithBalanceSchema } from '@6pm/validation'
import { createQueryKeys } from '@lukemorales/query-key-factory'
import { useQuery } from '@tanstack/react-query'

export const walletQueries = createQueryKeys('wallet', {
  list: () => ({
    queryKey: [{}],
    queryFn: async () => {
      const hc = await getHonoClient()
      const res = await hc.v1.wallets.wallets.$get()
      if (!res.ok) {
        throw new Error(await res.text())
      }
      const rawResult = await res.json()
      const result = rawResult.map((item) =>
        WalletAccountWithBalanceSchema.parse(item),
      )
      return result
    },
  }),
})

export function useWallets() {
  return useQuery(walletQueries.list())
}
