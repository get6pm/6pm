import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { zLogin } from '../validation'

const authApp = new Hono()

authApp.get('/login', zValidator('query', zLogin), (c) => {
  const { email, password } = c.req.valid('query')
  return c.json({
    message: 'Login',
    email,
    password,
    env: process.env.NODE_ENV,
  })
})

export default authApp
