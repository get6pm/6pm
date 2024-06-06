import { Hono } from 'hono'
import { authMiddleware } from './middlewares/auth'
import authApp from './routes/auth'

export const hono = new Hono()

hono.use('*', authMiddleware())

hono.get('/', (c) => {
  return c.json({ message: 'Hello Hono!' })
})

hono.route('/auth', authApp)
