import type { User } from '@/prisma/generated/zod'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import { createMiddleware } from 'hono/factory'
import { findUserById } from '../services/user.service'

declare module 'hono' {
  interface ContextVariableMap {
    user: User | null
    userId: string | null
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  await clerkMiddleware()(c, () => Promise.resolve())
  const auth = getAuth(c)

  if (!auth?.userId) {
    c.set('userId', null)
    c.set('user', null)
    return c.json({ message: 'unauthorized' }, 401)
  }

  c.set('userId', auth.userId)

  const user = await findUserById(auth.userId)

  c.set('user', user)
  c.header('x-user-id', auth.userId)

  await next()
})
