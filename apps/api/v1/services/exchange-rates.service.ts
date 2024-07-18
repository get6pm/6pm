import got from 'got'
import { getLogger } from '../../lib/log'
import prisma from '../../lib/prisma'

const API_KEY = process.env.EXCHANGERATES_API_KEY
const BASE_URL = 'http://api.exchangeratesapi.io/v1/'
const BASE_CURRENCY = 'EUR'
const DEFAULT_SYMBOLS = ['USD', 'JPY', 'AUD', 'VND', 'SGD', 'CNY']
const client = got.extend({
  prefixUrl: BASE_URL,
})

export async function getExchangeRates({
  date = 'latest',
  base = BASE_CURRENCY,
  symbols = DEFAULT_SYMBOLS,
}: {
  date?: string | 'latest'
  base?: string
  symbols?: string[]
}) {
  const logger = getLogger(`services.exchange-rates:${getExchangeRates.name}`)
  logger.debug(
    'Getting exchange rates. Date: %s, Base: %s, Symbols: %o',
    date,
    base,
    symbols,
  )

  // YYYY-MM-DD
  const dateStr = (date === 'latest' ? new Date() : new Date(date))
    .toISOString()
    .split('T')[0]

  // Find records in database
  const rates = await prisma.currencyExchangeRate.findMany({
    where: {
      date: dateStr,
      fromCurrency: base,
      toCurrency: {
        in: symbols,
      },
    },
  })

  // If some rates are missing, call the API
  const missingSymbols = symbols.filter(
    (symbol) =>
      !rates.find(
        (rate) => rate.toCurrency === symbol && rate.fromCurrency === base,
      ),
  )

  if (missingSymbols.length === 0) {
    logger.debug('All rates are found in the database')
    return rates
  }

  const missingSymbolsStr = missingSymbols.join(',')

  logger.debug('Some rates are missing. Calling the API: %s', missingSymbolsStr)

  const missingRates = await client
    .get(`${date === 'latest' ? date : dateStr}`, {
      searchParams: {
        access_key: API_KEY,
        base,
        symbols: missingSymbolsStr,
      },
    })
    .json<{
      success: boolean
      timestamp: number
      base: string
      date: string
      rates: Record<string, number>
    }>()
  // Save the result to database
  logger.debug('Saving the missing rates to the database')
  await prisma.currencyExchangeRate.createMany({
    data: Object.entries(missingRates.rates).map(([toCurrency, rate]) => ({
      date: missingRates.date,
      fromCurrency: base,
      toCurrency,
      rate,
    })),
  })
  // Return all the rates
  const allRates = await prisma.currencyExchangeRate.findMany({
    where: {
      date: dateStr,
      fromCurrency: base,
      toCurrency: {
        in: symbols,
      },
    },
  })

  logger.debug('All rates are found')

  return allRates
}

export async function getExchangeRate({
  date = 'latest',
  fromCurrency = BASE_CURRENCY,
  toCurrency,
}: {
  date?: string | 'latest'
  fromCurrency?: string
  toCurrency: string
}) {
  const baseRates = await getExchangeRates({
    date,
    base: BASE_CURRENCY,
    symbols: [fromCurrency, toCurrency],
  })
  const fromRate = baseRates.find((rate) => rate.toCurrency === fromCurrency)
  const toRate = baseRates.find((rate) => rate.toCurrency === toCurrency)

  if (!(fromRate && toRate)) {
    return null
  }

  const rateDecimal = toRate.rate.div(fromRate.rate)
  const rate = rateDecimal.toNumber()

  return {
    rate,
    rateDecimal,
    fromCurrency,
    toCurrency,
    // YYYY-MM-DD
    date: date === 'latest' ? new Date().toISOString().split('T')[0] : date,
    [fromCurrency]: 1,
    [toCurrency]: rate,
  }
}
