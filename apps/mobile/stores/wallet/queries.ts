import { getHonoClient } from '@/lib/client'
import {
  type WalletAccountWithBalance,
  WalletAccountWithBalanceSchema,
} from '@6pm/validation'
import { createQueryKeys } from '@lukemorales/query-key-factory'
import { z } from 'zod'

export const walletQueries = createQueryKeys('wallet', {
  all: ({
    setWalletsState,
  }: {
    setWalletsState: (wallets: WalletAccountWithBalance[]) => void
  }) => ({
    queryKey: [{}],
    queryFn: async () => {
      const hc = await getHonoClient()
      const res = await hc.v1.wallets.$get()

      if (!res.ok) {
        throw new Error(await res.text())
      }

      try {
        const items = await res.json()
        const wallets = items.map((item) =>
          WalletAccountWithBalanceSchema.extend({
            id: z.string().cuid2(),
          }).parse(item),
        )

        setWalletsState(wallets)
        return wallets
      } catch (error) {
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(error)
      }
    },
  }),
})
