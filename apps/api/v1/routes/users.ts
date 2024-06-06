import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { createUser } from '../services/user.service'
import { zCreateUser } from '../validation'

const router = new Hono()

router.post('/', zValidator('json', zCreateUser), async (c) => {
  const existingUser = c.get('user')

  if (existingUser) {
    return c.json({ message: 'user already exists' }, 409)
  }

  const userId = c.get('userId')!
  const data = c.req.valid('json')

  try {
    const user = await createUser({ ...data, id: userId })
    return c.json(user, 201)
  } catch (e) {
    return c.json({ userId, message: 'failed to create user', cause: e }, 500)
  }
})

export default router
