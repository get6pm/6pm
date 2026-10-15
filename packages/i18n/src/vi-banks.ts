import type { Entry } from './catalogue-types';
import type { enBanks } from './en-banks';

export const viBanks: { readonly [Key in keyof typeof enBanks]: Entry } = {
  'banks.title': 'Ngân hàng và ví',
  'banks.sub': 'Để 6pm đọc được biên lai và mã QR của tụi nó. Chọn hết cái bạn dùng.',
  'banks.search': 'Tìm ngân hàng, ví',
  'banks.clear': 'Xoá tìm kiếm',
  'banks.suggested': 'Gợi ý cho bạn',
  'banks.yours': 'Của bạn và gợi ý',
  'banks.all': 'Tất cả ngân hàng và ví',
  'banks.none': 'Không có ngân hàng hay ví nào khớp “{query}”.',
};
