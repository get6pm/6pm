import type { Entry } from './catalogue-types';
import type { enSharing } from './en-sharing';

export const viSharing: { readonly [Key in keyof typeof enSharing]: Entry } = {
  'sharing.saveImage': 'Lưu ảnh',
  'sharing.share': 'Chia sẻ',
  'sharing.saved': 'Đã lưu vào Ảnh.',
  'sharing.photosOff': '6pm chưa được lưu vào Ảnh.',
  'sharing.openSettings': 'Mở Cài đặt',
  'sharing.failed': 'Chưa tạo được ảnh. Thử lại nhé.',
};
