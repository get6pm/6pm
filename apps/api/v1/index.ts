import { Hono } from 'hono'
import { authMiddleware } from './middlewares/auth'
import authApp from './routes/auth'
import budgetsApp from './routes/budgets'
import transactionsApp from './routes/transactions'
import usersApp from './routes/users'
import walletsApp from './routes/wallets'

export const hono = new Hono()

hono.use('*', authMiddleware)

hono.route('/auth', authApp)
hono.route('/budgets', budgetsApp)
hono.route('/users', usersApp)
hono.route('/transactions', transactionsApp)
hono.route('/wallets', walletsApp)
