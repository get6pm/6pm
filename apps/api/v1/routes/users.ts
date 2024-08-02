import { zCreateUser } from '@6pm/validation'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { getAuthUser } from '../middlewares/auth'
import { bootstrapUserDefaultCategories } from '../services/category.service'
import { createUser } from '../services/user.service'
import { zDeviceLanguageHeader } from './utils'

const router = new Hono().post(
  '/',
  zValidator('json', zCreateUser),
  zDeviceLanguageHeader,
  async (c) => {
    const existingUser = getAuthUser(c)
    const deviceLanguage = c.req.valid('header')['x-device-language']

    if (existingUser) {
      return c.json({ message: 'user already exists' }, 409)
    }

    const userId = c.get('userId')!
    const data = c.req.valid('json')

    try {
      const user = await createUser({ data: { ...data, id: userId } })

      // bootstrap user data
      await bootstrapUserDefaultCategories({ user, language: deviceLanguage })

      return c.json(user, 201)
    } catch (e) {
      return c.json({ userId, message: 'failed to create user', cause: e }, 500)
    }
  },
)

export default router
