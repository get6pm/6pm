import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import {
  getExchangeRate,
  getExchangeRates,
} from '../services/exchange-rates.service'

const router = new Hono()
  // TODO: Enable this later
  // .use(async (c, next) => {
  //   const apiKey = c.req.header('x-api-key')

  //   if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
  //     return c.json({ message: 'Unauthorized' }, 401)
  //   }

  //   await next()
  // })

  .get(
    '/',
    zValidator(
      'query',
      z.object({
        date: z.string().default('latest'),
      }),
    ),
    async (c) => {
      const { date } = c.req.valid('query')

      const exchangeRates = await getExchangeRates({ date })

      return c.json(exchangeRates)
    },
  )

  .get(
    '/:fromCurrency/:toCurrency',
    zValidator(
      'query',
      z.object({
        date: z.string().default('latest'),
      }),
    ),
    zValidator(
      'param',
      z.object({
        fromCurrency: z.string(),
        toCurrency: z.string(),
      }),
    ),
    async (c) => {
      const { fromCurrency, toCurrency } = c.req.valid('param')
      const { date } = c.req.valid('query')

      const exchangeRate = await getExchangeRate({
        date,
        fromCurrency: fromCurrency,
        toCurrency: toCurrency,
      })

      if (!exchangeRate) {
        return c.json({ message: 'Exchange rate not found' }, 404)
      }

      return c.json(exchangeRate)
    },
  )

export default router
