import listCurrencies from './currencies.json'

export * from './formatter'

export const SUPPORTED_CURRENCIES = ['USD', 'JPY', 'AUD', 'VND', 'SGD', 'CNY']

export const currencies = listCurrencies.filter((currency) =>
  SUPPORTED_CURRENCIES.includes(currency.code),
)
