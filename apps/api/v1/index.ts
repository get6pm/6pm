import { Hono } from 'hono'

export const hono = new Hono()

hono.get('/', (c) => {
  return c.json({ message: 'Hello Hono!' })
})

hono.get('version', (c) => {
  return c.json({ version: '1.0.0' })
})
