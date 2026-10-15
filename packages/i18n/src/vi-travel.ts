import type { Entry } from './catalogue-types';
import type { enTravel } from './en-travel';

export const viTravel: { readonly [Key in keyof typeof enTravel]: Entry } = {
  'travel.settings.label': 'Chế độ Du lịch',
  'travel.settings.sub': 'Tự bật khi ra nước ngoài',
  'travel.settings.locationOff': 'Cho phép vị trí để biết khi bạn ở nước ngoài',
  'travel.settings.stale': 'Tỷ giá ngày {date}',
  'travel.settings.noRates': 'Đang chờ tỷ giá hôm nay',
  'travel.pill': '{place} · {symbol} kèm {home} bên dưới',
  'travel.activity.place': '{place} · hôm nay',
  'travel.activity.left': 'còn {amount}',
  'travel.activity.over': 'lố {amount}',
  'travel.activity.of': 'trên {line} · ≈ {vnd}',
  'travel.quick.underneath': 'khoảng {amount}',
  'travel.quick.underneathStale': 'khoảng {amount} · tỷ giá ngày {date}',
  'travel.quick.currency': 'Đổi đơn vị tiền',
  'travel.scan.body':
    'Trả bằng app ngân hàng: hầu hết ngân hàng Việt Nam nhận mã này. 6pm ghi bằng {symbol}, kèm ₫ bên dưới.',
  'travel.scan.bodyAway':
    'Trả theo cách bạn vẫn trả ở đó. 6pm ghi bằng {symbol}, kèm {home} bên dưới.',
  'travel.scan.keep': 'Đã trả · ghi {amount}',
  'travel.scan.logIn': 'Ghi bằng {symbol}',
};
