import { maxPrices } from './config';
import type { SiteLang } from './copy';

/** A Max price as the page prints it: `$4.99`, `99.000₫`. */
export function maxPriceLabel(lang: SiteLang, period: 'month' | 'year'): string {
  const amount = maxPrices[lang][period];
  return lang === 'vi' ? `${amount.toLocaleString('vi-VN')}₫` : `$${amount.toFixed(2)}`;
}

/** What paying yearly saves on twelve months, as the toggle prints it: `−33%`. */
export function yearlySavingLabel(lang: SiteLang): string {
  const { month, year } = maxPrices[lang];
  return `−${Math.round((1 - year / (month * 12)) * 100)}%`;
}
