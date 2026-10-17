import type { Entry } from './catalogue-types';
import type { enAndroid } from './en-android';

export const viAndroid: { readonly [Key in keyof typeof enAndroid]: Entry } = {
  'ask.howTo.ways':
    'Có ba cách: Thêm nhanh (gõ hoặc nói), quét mã QR hoặc hoá đơn, và chuyển tiếp email hóa đơn. Những gì 6pm tự bắt được sẽ chờ trong Inbox tới lúc chốt ngày.',
  'capture.share.headline':
    'Lưu biên lai thành ảnh, rồi chọn ảnh đó trong Quét. Mình sẽ đọc số tiền.',
  'capture.wallet.headline':
    'Điện thoại này không có Apple Pay. Chuyển tiếp email biên lai của thẻ là chúng tự xuất hiện.',
  'capture.widgets.headline':
    'Điện thoại này không có tiện ích 6pm. Giữ nút quét là Thêm nhanh mở ra.',

  'backup.row.on': 'Đã mã hoá, {when}',
  'backup.status.sub': { other: '{count} mục · đã mã hóa. 6pm vẫn chạy tốt khi không có nó.' },
  'backup.status.neverSub': 'Đã mã hóa. 6pm vẫn chạy tốt khi không có nó.',
  'backup.off.sub':
    'Được niêm phong ngay trên điện thoại trước khi gửi đi. Khóa nằm lại trên máy này, nên chúng tôi không đọc được gì.',
  'backup.tooLarge':
    'Bản sao lưu gần nhất quá lớn nên chưa gửi được. Mọi thứ vẫn nằm trên điện thoại.',
  'backup.note':
    'Sao lưu mỗi ngày một lần, sau khi bạn chốt ngày. Khóa không bao giờ rời điện thoại này, nên bản sao lưu chỉ mở được ở đây, không mở được trên máy mới.',
  'backup.paused':
    'Sao lưu tạm dừng khi không có Max. Bản sao lưu gần nhất vẫn an toàn, đã mã hoá.',
  'backup.found.title': 'Điện thoại này đã có một bản sao lưu.',
  'backup.found.sub': 'Nó đến từ lần cài trước. Sao lưu từ máy này sẽ thay thế nó.',
  'backup.found.restoreConfirm': 'Chạm lần nữa để thay các ngày trên điện thoại này',
  'backup.found.replace': 'Thay bằng điện thoại này',
  'backup.restore.sub': { other: '{count} mục · đã mã hóa.' },
  'backup.restore.none': 'Không tìm thấy bản sao lưu cho điện thoại này.',
  'backup.restore.wrongKey': 'Khóa trên điện thoại này không mở được bản sao lưu.',
  'backup.error.keychain': 'Điện thoại không lưu được khóa nên chưa sao lưu gì. Thử lại nhé.',
  'backup.error.tooLarge': 'Bản sao lưu quá lớn để gửi. Mọi thứ vẫn nằm trên điện thoại.',

  'capture.email.sub': 'Điện thoại này chưa có địa chỉ chuyển tiếp',
  'capture.scan.tip': 'Giữ nút quét để Thêm nhanh khi không có mã để quét.',
  'onboarding.catch.add.body': 'Giữ nút quét để Thêm nhanh rồi nói “cà phê {amount}”.',
  'today.list.empty': 'Chưa có khoản nào. Quét mã QR hay hoá đơn, hoặc chạm +.',

  'looks.restore.none': 'Không có gì để khôi phục trên tài khoản Google này.',
  'looks.restore.failed': 'Không kết nối được Google Play. Thử lại nhé.',
  'looks.legal':
    'Giao diện được mua một lần trên tài khoản Google của bạn. Max là gói đăng ký, huỷ lúc nào cũng được trong Google Play. Giá do Google Play hiển thị.',
  'look.buying': 'Đang chờ Google Play…',
  'look.noteStoreOff': 'Google Play chưa phản hồi, nên chưa thể mua giao diện này.',
  'max.cta.waiting': 'Đang chờ Google Play…',
  'max.terms.storeOff': 'Chưa thể mua Max lúc này: Google Play chưa phản hồi.',
  'max.sub.backup': 'Sao lưu mã hoá, toàn bộ lịch sử, CSV và Sheets.',
  'max.note.backup': 'Sao lưu mã hoá, CSV và Sheets',
  'max.welcome.win.more': 'Hũ, du lịch và Sách năm',

  'privacy.ai.device.title': 'Chỉ trên điện thoại này',
  'privacy.ai.device.unavailable': 'Điện thoại này không đủ bộ nhớ để chạy mô hình riêng.',
  'settings.ai.device': 'Trên điện thoại này',
  'privacy.leaves.device.none':
    'Không gì liên quan AI. Mọi thứ được tính ngay trên điện thoại này.',
  'receiptEmail.deviceMode': 'Tắt khi AI chạy ngay trên điện thoại',
  'receiptEmail.deviceMode.body':
    'Biên lai qua email cần máy chủ của chúng tôi đọc thư, nên tính năng này tắt khi 6pm giữ AI ngay trên điện thoại. Bạn có thể quét biên lai thay thế.',
  'settings.privacyBody':
    'Tiền của bạn nằm trên điện thoại này, được mã hoá. Để đọc câu hỏi Ask và viết lời của bạn đồng hành, 6pm gửi tới Anthropic, một dịch vụ AI, câu hỏi hoặc vài thông tin về ngày của bạn: số tiền, tên nơi chi và danh mục, không bao giờ cả danh sách khoản chi. Ảnh biên lai mà điện thoại không đọc được cũng gửi tới đó. Anthropic không dùng chúng để huấn luyện và xoá trong vòng 30 ngày. Khi bạn đọc một khoản chi, giọng nói được gửi tới Deepgram để chuyển thành chữ. Ở mục AI phía trên, bạn có thể giữ tất cả những điều này trên điện thoại. Bản sao lưu chỉ rời máy khi bạn bật, và được mã hoá đầu cuối. Báo cáo sự cố gửi đến Sentry, không kèm số tiền, tên hay ghi chú; RevenueCat xử lý việc mua.',

  'scan.handoff.store': 'Điện thoại này chưa có {wallet}',
  'scan.handoff.savedQr':
    'Đã lưu mã QR vào thư viện ảnh: quét từ ảnh trong app ngân hàng nhé. Quay lại mình hỏi.',
  'sharing.saved': 'Đã lưu vào thư viện ảnh.',
  'sharing.photosOff': '6pm chưa được lưu vào thư viện ảnh.',

  'startup.failedSub': 'Không mất gì đâu. Thử lại nhé, nếu vẫn vậy thì khởi động lại điện thoại.',
  'voice.unavailable': 'Giọng nói cần tính năng đọc chính tả {language} trên điện thoại này',
};
