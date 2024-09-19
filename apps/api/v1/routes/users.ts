import { zCreateUser } from '@6pm/validation'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { getLogger } from '../../lib/log'
import { getAuthUser } from '../middlewares/auth'
import { bootstrapUserDefaultCategories } from '../services/category.service'
import { deleteClerkUser } from '../services/clerk.service'
import { createUser } from '../services/user.service'
import { bootstrapUserDefaultWalletAccounts } from '../services/wallet.service'
import { zDeviceCurrencyHeader, zDeviceLanguageHeader } from './utils'

const router = new Hono().post(
  '/',
  zValidator('json', zCreateUser),
  zDeviceLanguageHeader(),
  zDeviceCurrencyHeader(),
  async (c) => {
    const existingUser = getAuthUser(c)
    const deviceLanguage = c.req.valid('header')['x-device-language']
    const deviceCurrency = c.req.valid('header')['x-device-currency']
    const logger = getLogger('POST /users')

    if (existingUser) {
      return c.json({ message: 'user already exists' }, 409)
    }

    const userId = c.get('userId')

    if (!userId) {
      logger.warn('Clerk userId not found from headers while creating user')
      return c.json({ message: 'unauthorized' }, 401)
    }

    const data = c.req.valid('json')

    try {
      const user = await createUser({ data: { ...data, id: userId } })

      // bootstrap user data
      await Promise.all([
        bootstrapUserDefaultCategories({ user, language: deviceLanguage }),
        bootstrapUserDefaultWalletAccounts({
          user,
          preferredCurrency: deviceCurrency,
          language: deviceLanguage,
        }),
      ])

      return c.json(user, 201)
    } catch (e) {
      logger.error('Failed to create user %o', e)

      await deleteClerkUser(userId)

      return c.json({ userId, message: 'failed to create user', cause: e }, 500)
    }
  },
)

export default router
