import { getAuth } from '@hono/clerk-auth'
import { Hono } from 'hono'
import { findUserById } from '../services/user.service'

const router = new Hono().get('/me', async (c) => {
  const auth = getAuth(c)

  if (!auth?.userId) {
    return c.json({ message: 'unauthorized' }, 401)
  }

  const user = await findUserById(auth.userId)

  if (!user) {
    return c.json({ message: 'unauthorized' }, 401)
  }

  return c.json(user)
})

export default router
