import type { Entry } from './catalogue-types';
import type { enReceiptEmail } from './en-receipt-email';

export const viReceiptEmail: { readonly [Key in keyof typeof enReceiptEmail]: Entry } = {
  'receiptEmail.copy': 'Sao chép địa chỉ',
  'receiptEmail.share': 'Chia sẻ địa chỉ 6pm của bạn',
  'receiptEmail.offline': 'Địa chỉ của bạn hiện ra khi có mạng',
  'receiptEmail.from': 'Từ {address}',
  'receiptEmail.deviceMode': 'Tắt khi AI chạy ngay trên iPhone',
  'receiptEmail.deviceMode.body':
    'Biên lai qua email cần máy chủ của chúng tôi đọc thư, nên tính năng này tắt khi 6pm giữ AI ngay trên iPhone. Bạn có thể chia sẻ hoặc quét biên lai thay thế.',
  'receiptEmail.check.title': '{provider} đang hỏi xác nhận chuyển tiếp thư từ {address}',
  'receiptEmail.check.titleNoAddress': '{provider} đang hỏi xác nhận chuyển tiếp thư tới 6pm',
  'receiptEmail.check.code': 'Mã xác nhận',
  'receiptEmail.check.copy': 'Sao chép',
  'receiptEmail.check.copyLabel': 'Sao chép mã xác nhận',
  'receiptEmail.check.copied': 'Đã chép mã.',
  'receiptEmail.check.hint':
    'Mở trang xác nhận, hoặc dán mã vào phần cài đặt {provider}. Sau đó biên lai chuyển tiếp sẽ về đây.',
  'receiptEmail.check.open': 'Mở trang xác nhận',
  'receiptEmail.check.openFailed': 'Không mở được trang. Hãy sao chép mã nhé.',
  'receiptEmail.check.hintNoCode':
    'Mở trang xác nhận rồi bấm Xác nhận. Sau đó biên lai chuyển tiếp sẽ về đây.',
  'receiptEmail.check.openFailedNoCode': 'Không mở được trang. Thử lại sau chút nhé.',
  'receiptEmail.check.done': 'Xong',
};
