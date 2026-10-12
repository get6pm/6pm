import type { Entry } from './catalogue-types';
import type { enNative } from './en-native';

export const viNative: { readonly [Key in keyof typeof enNative]: Entry } = {
  'native.permission.camera': '6pm dùng camera để đọc mã VietQR khi bạn quét để trả tiền.',
  'native.permission.microphone':
    '6pm nghe khi bạn giữ để nói một khoản chi. Lời bạn nói được hiểu ngay trên iPhone này.',
  'native.permission.speech':
    '6pm chuyển lời bạn nói thành số tiền và tên khoản chi, ngay trên iPhone này. Không gửi đi đâu cả.',
  'native.permission.photosAdd':
    '6pm lưu biên lai cuối ngày và nhật ký tiêu tiền vào Ảnh khi bạn yêu cầu.',
  'native.permission.location':
    '6pm kiểm tra bạn đang ở nước nào để chế độ Du lịch tự bật khi bạn ra nước ngoài.',
  'native.surfaces.safeToday.name': 'Hôm nay tiêu được',
  'native.surfaces.safeToday.description': 'Số tiền bạn có thể tiêu hôm nay, nhìn là thấy.',
  'native.surfaces.setUp': 'Mở 6pm để cài đặt',
  'native.surfaces.markPaid.title': 'Đã trả',
  'native.share.title': 'Thêm vào 6pm',
  'native.intents.logSpend.title': 'Ghi vào 6pm',
  'native.intents.logSpend.amount': 'Số tiền',
  'native.intents.logSpend.merchant': 'Ở đâu',
};
