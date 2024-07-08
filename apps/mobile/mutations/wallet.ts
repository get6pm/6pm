import { getHonoClient } from '@/lib/client'
import type { AccountFormValues } from '@6pm/validation'

export async function createWallet(data: AccountFormValues) {
  const { balance, ...walletData } = data
  const hc = await getHonoClient()
  const result = await hc.v1.wallets.wallets.$post({
    json: walletData,
  })
  if (result.ok) {
    const wallet = await result.json()
    await hc.v1.transactions.$post({
      json: {
        amount: balance ?? 0,
        walletAccountId: wallet.id,
        currency: wallet.preferredCurrency,
        date: new Date(),
        note: 'Initial balance',
      },
    })
  }
  return result
}

export async function updateWallet({
  id,
  data,
}: {
  id: string
  data: AccountFormValues
}) {
  const { balance, ...walletData } = data
  const hc = await getHonoClient()
  const result = await hc.v1.wallets.wallets[':walletId'].$put({
    param: { walletId: id },
    json: walletData,
  })
  if (result.ok && balance) {
    const wallet = await result.json()
    await hc.v1.transactions.$post({
      json: {
        amount: balance ?? 0,
        walletAccountId: wallet.id,
        currency: wallet.preferredCurrency,
        date: new Date(),
        note: 'Adjust balance',
      },
    })
  }
  return result
}

export async function deleteWallet(id: string) {
  const hc = await getHonoClient()
  await hc.v1.wallets.wallets[':walletId'].$delete({
    param: { walletId: id },
  })
}
