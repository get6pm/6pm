import { zCreateWallet, zUpdateWallet } from '@6pm/validation'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { object, string } from 'zod'
import { getAuthUserStrict } from '../middlewares/auth'
import {
  canUserCreateWallet,
  canUserDeleteWallet,
  canUserUpdateWallet,
  createWallet,
  deleteWallet,
  findUserWallet,
  findUserWallets,
  getWalletBalance,
  updateWallet,
  walletWithBalance,
} from '../services/wallet.service'

const router = new Hono()

  .get('', async (c) => {
    const user = getAuthUserStrict(c)

    const wallets = await Promise.all(
      (await findUserWallets({ user })).map(walletWithBalance),
    )

    return c.json(wallets, 200)
  })

  .post('', zValidator('json', zCreateWallet), async (c) => {
    const user = getAuthUserStrict(c)

    if (!(await canUserCreateWallet({ user }))) {
      return c.json({ message: 'forbidden' }, 403)
    }

    const data = c.req.valid('json')

    const wallet = await createWallet({ user, data })

    return c.json(await walletWithBalance(wallet), 201)
  })

  .put(
    '/:walletId',
    zValidator('param', object({ walletId: string() })),
    zValidator('json', zUpdateWallet),
    async (c) => {
      const user = getAuthUserStrict(c)
      const { walletId } = c.req.valid('param')

      const wallet = await findUserWallet({ user, walletId })

      if (!wallet) {
        return c.json({ message: 'wallet not found' }, 404)
      }

      if (!(await canUserUpdateWallet({ user, walletId }))) {
        return c.json({ message: 'forbidden' }, 403)
      }

      const data = c.req.valid('json')

      const updatedWallet = await updateWallet({ walletId, data })

      return c.json(await walletWithBalance(updatedWallet), 200)
    },
  )

  .delete(
    '/:walletId',
    zValidator('param', object({ walletId: string() })),
    async (c) => {
      const user = getAuthUserStrict(c)
      const { walletId } = c.req.valid('param')

      const wallet = await findUserWallet({ user, walletId })

      if (!wallet) {
        return c.json({ message: 'wallet not found' }, 404)
      }

      if (!(await canUserDeleteWallet({ user, walletId }))) {
        return c.json({ message: 'forbidden' }, 403)
      }

      await deleteWallet({ walletId })

      return c.json(wallet, 200)
    },
  )

  .get(
    '/:walletId/balance',
    zValidator('param', object({ walletId: string() })),
    async (c) => {
      const user = getAuthUserStrict(c)
      const { walletId } = c.req.valid('param')

      const wallet = await findUserWallet({ user, walletId })

      if (!wallet) {
        return c.json({ message: 'wallet not found' }, 404)
      }

      const balance = await getWalletBalance({ wallet })

      return c.json({ wallet, balance }, 200)
    },
  )

export default router
