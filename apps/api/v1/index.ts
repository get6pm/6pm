import { Hono } from 'hono'
import { authMiddleware } from './middlewares/auth'
import authApp from './routes/auth'

export const hono = new Hono()

hono.use('*', authMiddleware())

hono.get('/', (c) => {
  return c.json({ message: 'Hello Hono!' })
})

hono.get('version', (c) => {
  return c.json({ version: '1.0.0' })
})

hono.route('/auth', authApp)
