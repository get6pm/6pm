import type { Entry } from './catalogue-types';
import type { enSurfaces } from './en-surfaces';

export const viSurfaces: { readonly [Key in keyof typeof enSurfaces]: Entry } = {
  'surfaces.scanQr': 'Quét QR',
  'surfaces.safeTodayShort': 'tiêu được hôm nay',
  'surfaces.today': 'Hôm nay',
  'surfaces.left': 'còn lại',
  'surfaces.amountLeft': 'Còn {amount}',
  'surfaces.brandSafe': '6pm · Hôm nay tiêu được',
  'surfaces.pending': { other: '{count} đang chờ' },
  'surfaces.more': { other: '+{count} khoản nữa' },
  'surfaces.listEmpty': 'Hôm nay chưa tiêu khoản nào',
  'surfaces.openApp': 'Mở 6pm',
  'surfaces.setUp': 'Mở 6pm để cài đặt',
  'surfaces.activity.waiting': 'Đang chờ · bấm khi đã trả',
  'surfaces.activity.to': '{amount} cho {merchant}',
  'surfaces.activity.paid': 'Đã trả',
  'surfaces.context.today': 'Hôm nay',
  'surfaces.context.yesterday': 'Hôm qua',
  'surfaces.context.safeAfter': 'Hôm nay giờ còn tiêu được {amount}',
};
