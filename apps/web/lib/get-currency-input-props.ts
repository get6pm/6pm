import { SUPPORTED_CURRENCIES } from '@6pm/db/static-data/currency'

export function getCurrencyInputProps(
  currencyCode: string,
  {
    noSymbol,
    noCode,
  }: {
    noSymbol?: boolean
    noCode?: boolean
  } = {},
) {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode)

  if (!currency) {
    return {
      thousandSeparator: ',',
    }
  }

  return {
    prefix: currency.symbolBefore
      ? noSymbol
        ? ''
        : currency.symbol
      : noCode
        ? ''
        : `${currency.code} `,
    suffix: currency.symbolBefore
      ? noCode
        ? ''
        : ` ${currencyCode}`
      : noSymbol
        ? ''
        : currency.symbol,
    thousandSeparator: ',',
    decimalScale: currency.decimalDigits,
  }
}
