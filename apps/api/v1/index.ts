import { Hono } from 'hono'
import { authMiddleware } from './middlewares/auth'
import authApp from './routes/auth'
import usersApp from './routes/users'

export const hono = new Hono()

hono.use('*', authMiddleware)

hono.route('/auth', authApp)
hono.route('/users', usersApp)