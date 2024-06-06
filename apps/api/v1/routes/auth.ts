import { getAuth } from '@hono/clerk-auth'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { findUserById } from '../services/user.service'

const router = new Hono()

router.get('/me', async (c) => {
  const auth = getAuth(c)

  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'unauthorized' })
  }

  const user = await findUserById(auth.userId)

  if (!user) {
    throw new HTTPException(401, { message: 'unauthorized' })
  }

  return c.json(user)
})

export default router
