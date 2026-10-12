import type { Entry } from './catalogue-types';
import type { enReceiptEmail } from './en-receipt-email';

export const viReceiptEmail: { readonly [Key in keyof typeof enReceiptEmail]: Entry } = {
  'receiptEmail.copy': 'Sao chép địa chỉ',
  'receiptEmail.share': 'Chia sẻ địa chỉ 6pm của bạn',
  'receiptEmail.offline': 'Địa chỉ của bạn hiện ra khi có mạng',
  'receiptEmail.from': 'Từ {address}',
};
