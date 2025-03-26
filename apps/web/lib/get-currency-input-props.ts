import { SUPPORTED_CURRENCIES } from '@6pm/db/static-data/currency'

export function getCurrencyInputProps(currencyCode: string) {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode)

  if (!currency) {
    return {
      thousandSeparator: ',',
    }
  }

  return {
    prefix: currency.symbolBefore ? currency.symbol : `${currency.code} `,
    suffix: currency.symbolBefore ? ` ${currencyCode}` : currency.symbol,
    thousandSeparator: ',',
    decimalScale: currency.decimalDigits,
  }
}
