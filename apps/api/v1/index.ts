import { Hono } from 'hono'
import { authMiddleware } from './middlewares/auth'
import authApp from './routes/auth'
import budgetsApp from './routes/budgets'
import categoriesApp from './routes/categories'
import transactionsApp from './routes/transactions'
import usersApp from './routes/users'
import walletsApp from './routes/wallets'

export const hono = new Hono()

  .use('*', authMiddleware)

  .route('/auth', authApp)
  .route('/budgets', budgetsApp)
  .route('/categories', categoriesApp)
  .route('/users', usersApp)
  .route('/transactions', transactionsApp)
  .route('/wallets', walletsApp)
