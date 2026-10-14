import type { Entry } from './catalogue-types';
import type { enCaptureWalk } from './en-capture-walk';

/** The labels inside the pictured screens are the Vietnamese iOS and Gmail ones. */
export const viCaptureWalk: { readonly [Key in keyof typeof enCaptureWalk]: Entry } = {
  'capture.walk.stepOf': 'Bước {step}/{total}',
  'capture.walk.next': 'Tiếp',
  'capture.walk.back': 'Lùi lại',
  'capture.walk.again': 'Xem lại từ đầu',
  'capture.walk.mistakes': 'Hay bị nhầm',

  'capture.walk.wallet.s1Title': 'Mở Phím tắt, rồi Tự động hóa',
  'capture.walk.wallet.s1Body':
    'Trong Thư viện, chạm Tự động hóa. Nếu Phím tắt mở ở Tất cả phím tắt, chạm mũi tên quay lại trước.',
  'capture.walk.wallet.s2Title': 'Chạm + để tạo mới',
  'capture.walk.wallet.s2Body':
    'Một phím tắt mới mở ra. Nếu thấy “Mô tả phím tắt”, chạm Sửa ở góc trên bên phải.',
  'capture.walk.wallet.s3Title': 'Thêm bộ kích hoạt Ví',
  'capture.walk.wallet.s3Body':
    'Ở bảng phía dưới, chạm Tự động hóa rồi chạm Ví. Thẻ “Khi Bất kỳ thẻ nào được chạm vào” sẽ hiện ra.',
  'capture.walk.wallet.s4Title': 'Thêm “Ghi vào 6pm”',
  'capture.walk.wallet.s4Body':
    'Chạm Tìm kiếm, gõ “Ghi vào 6pm” rồi chạm vào nó. Nó nằm ngay dưới Ví.',
  'capture.walk.wallet.s5Title': 'Điền Số tiền từ lần chạm',
  'capture.walk.wallet.s5Body':
    'Chạm ô Số tiền, rồi chạm Giao dịch ngay trên bàn phím. Chạm vào chữ Giao dịch màu xanh và chọn Số lượng.',
  'capture.walk.wallet.s6Title': 'Điền Ở đâu tương tự',
  'capture.walk.wallet.s6Body':
    'Chạm Ở đâu, rồi Giao dịch. Chạm vào nó lần nữa và chọn Điểm bán hàng.',
  'capture.walk.wallet.s7Title': 'Tắt Hiển thị khi chạy, rồi quay lại',
  'capture.walk.wallet.s7Body':
    'Để Tự động hóa bật. Quay lại là đã lưu. Muốn chỉ bắt vài thẻ, chạm Bất kỳ thẻ nào và chọn thẻ.',
  'capture.walk.wallet.s8Title': 'Thử ngay',
  'capture.walk.wallet.s8Body':
    'Trả một món bằng Apple Pay trên iPhone này, rồi mở 6pm. Lần chạm đã nằm trong Inbox.',
  'capture.walk.wallet.mistake1':
    'Tạo phím tắt mà không có thẻ “Khi Bất kỳ thẻ nào được chạm vào” ở trên cùng. Nó chỉ chạy khi bạn tự bấm.',
  'capture.walk.wallet.mistake2':
    'Để trống Số tiền và Ở đâu. Hai ô này phải có Số lượng và Điểm bán hàng màu xanh lấy từ Giao dịch.',
  'capture.walk.wallet.mistake3':
    'Để bật Hiển thị khi chạy. Mỗi lần chạm sẽ dừng lại hiện một thẻ thay vì ghi lặng lẽ.',
  'capture.walk.wallet.olderTitle': 'Trên iOS 26',
  'capture.walk.wallet.older1': 'Trong Phím tắt, mở tab Tự động hóa và chạm +.',
  'capture.walk.wallet.older2': 'Chạm Ví, chọn thẻ, chọn Chạy ngay lập tức, rồi Tiếp.',
  'capture.walk.wallet.older3': 'Chạm Tạo phím tắt mới và thêm “Ghi vào 6pm”.',
  'capture.walk.wallet.older4':
    'Đặt Số tiền là Đầu vào phím tắt › Số lượng và Ở đâu là Đầu vào phím tắt › Điểm bán hàng. Tắt Hiển thị khi chạy, rồi Xong.',

  'capture.walk.email.s1Title': 'Trên máy tính, mở cài đặt Gmail',
  'capture.walk.email.s1Body':
    'App Gmail không cài được chuyển tiếp. Mở Gmail trên web, bấm bánh răng, rồi Xem tất cả chế độ cài đặt.',
  'capture.walk.email.s2Title': 'Chuyển tiếp và POP/IMAP',
  'capture.walk.email.s2Body': 'Mở tab đó và bấm Thêm địa chỉ chuyển tiếp.',
  'capture.walk.email.s3Title': 'Dán địa chỉ 6pm của bạn',
  'capture.walk.email.s3Body': 'Sao chép bằng nút bên dưới, dán vào, rồi Tiếp theo và Tiếp tục.',
  'capture.walk.email.s4Title': 'Nhập mã 6pm đưa cho bạn',
  'capture.walk.email.s4Body':
    'Gmail gửi thư xác nhận tới địa chỉ 6pm và 6pm hiện mã cho bạn. Gõ mã vào cạnh nút Xác minh.',
  'capture.walk.email.s5Title': 'Tạo bộ lọc cho biên lai',
  'capture.walk.email.s5Body':
    'Đừng chuyển tiếp mọi thư. Mở tuỳ chọn tìm kiếm và điền các nơi gửi biên lai vào ô Từ.',
  'capture.walk.email.s6Title': 'Chuyển tiếp tới 6pm',
  'capture.walk.email.s6Body':
    'Bấm Tạo bộ lọc, đánh dấu Chuyển tiếp thư tới, chọn địa chỉ 6pm, rồi Tạo bộ lọc lần nữa.',
  'capture.walk.email.otherTitle': 'Hộp thư khác',
  'capture.walk.email.outlook': 'Outlook.com',
  'capture.walk.email.outlook1': 'Trên web, mở Cài đặt, rồi Thư, rồi Quy tắc.',
  'capture.walk.email.outlook2':
    'Thêm quy tắc mới: thư từ các nơi gửi biên lai thì chuyển tiếp tới địa chỉ 6pm.',
  'capture.walk.email.outlook3': 'Lưu. Outlook có thể bắt đăng nhập lại trước.',
  'capture.walk.email.icloud': 'iCloud Mail',
  'capture.walk.email.icloud1': 'Trên icloud.com/mail, mở Cài đặt, rồi Quy tắc, rồi +.',
  'capture.walk.email.icloud2': 'Thư từ một nơi gửi biên lai thì chuyển tiếp tới địa chỉ 6pm.',
  'capture.walk.email.icloud3': 'Mỗi nơi gửi một quy tắc. Có thể mất 15 phút mới chạy.',

  'capture.walk.share.s1Title': 'Mở biên lai trong app ngân hàng',
  'capture.walk.share.s1Body':
    'Màn hình sau khi chuyển khoản, hoặc một giao dịch cũ. Chạm Chia sẻ.',
  'capture.walk.share.s2Title': 'Chạm 6pm',
  'capture.walk.share.s2Body':
    'Chưa thấy thì vuốt hàng ứng dụng. Bạn cũng chia sẻ được một hay nhiều ảnh biên lai.',
  'capture.walk.share.s3Title': 'Xem lại và xác nhận',
  'capture.walk.share.s3Body':
    'Mình đọc số tiền và người nhận. Xác nhận là khoản chi nằm trong Inbox.',
  'capture.walk.share.inInbox': 'Đã vào Inbox',

  'capture.walk.bank.done': 'Chuyển khoản thành công',
  'capture.walk.bank.from': 'Từ',
  'capture.walk.bank.share': 'Chia sẻ',
  'capture.walk.bank.home': 'Trang chủ',

  'capture.walk.test.paid': 'Xong',
  'capture.walk.test.inbox': 'Inbox',
  'capture.walk.test.row': 'Apple Pay · chờ duyệt',

  'capture.walk.ios.library': 'Thư viện',
  'capture.walk.ios.allShortcuts': 'Tất cả phím tắt',
  'capture.walk.ios.shareSheet': 'Bảng chia sẻ',
  'capture.walk.ios.gallery': 'Bộ sưu tập',
  'capture.walk.ios.automation': 'Tự động hóa',
  'capture.walk.ios.apps': 'Ứng dụng',
  'capture.walk.ios.edit': 'Sửa',
  'capture.walk.ios.noAutomations': 'Không có mục tự động hóa',
  'capture.walk.ios.noAutomationsSub': 'Làm cho các phím tắt chạy tự động.',
  'capture.walk.ios.newShortcut': 'Phím tắt mới',
  'capture.walk.ios.describe': 'Mô tả phím tắt',
  'capture.walk.ios.addActions': 'Thêm các tác vụ ở bên dưới để tạo một phím tắt.',
  'capture.walk.ios.search': 'Tìm kiếm',
  'capture.walk.ios.scripting': 'Soạn tập lệnh',
  'capture.walk.ios.sendMessage': 'Gửi tin nhắn',
  'capture.walk.ios.openApp': 'Mở ứng dụng',
  'capture.walk.ios.playMusic': 'Phát nhạc',
  'capture.walk.ios.app': 'Ứng dụng',
  'capture.walk.ios.appEx': '“Khi mở hoặc đóng ứng dụng Thời tiết”',
  'capture.walk.ios.wallet': 'Ví',
  'capture.walk.ios.walletEx': '“Khi tôi chạm vào một thẻ hoặc vé trong Ví”',
  'capture.walk.ios.screenshot': 'Ảnh màn hình',
  'capture.walk.ios.screenshotEx': '“Khi ảnh màn hình được lưu”',
  'capture.walk.ios.when': 'Khi',
  'capture.walk.ios.isTapped': 'được chạm vào',
  'capture.walk.ios.anyCard': 'Bất kỳ thẻ nào',
  'capture.walk.ios.showWhenRun': 'Hiển thị khi chạy',
  'capture.walk.ios.shortcutInput': 'Đầu vào phím tắt',
  'capture.walk.ios.transaction': 'Giao dịch',
  'capture.walk.ios.clearVariable': 'Xóa biến',
  'capture.walk.ios.return': 'Trở lại',
  'capture.walk.ios.get': 'Lấy',
  'capture.walk.ios.cardOrPass': 'Thẻ hoặc vé',
  'capture.walk.ios.merchant': 'Điểm bán hàng',
  'capture.walk.ios.amount': 'Số lượng',
  'capture.walk.ios.name': 'Tên',
  'capture.walk.ios.personal': 'Cá nhân',
  'capture.walk.ios.walletSummary': 'Khi tôi chạm vào một thẻ thanh toán hoặc thẻ Ví',
  'capture.walk.ios.messages': 'Tin nhắn',
  'capture.walk.ios.mail': 'Mail',
  'capture.walk.ios.image': 'Hình ảnh',
  'capture.walk.ios.copy': 'Sao chép',
  'capture.walk.ios.saveImage': 'Lưu hình ảnh',

  'capture.walk.gmail.searchMail': 'Tìm kiếm trong thư',
  'capture.walk.gmail.quickSettings': 'Cài đặt nhanh',
  'capture.walk.gmail.seeAll': 'Xem tất cả chế độ cài đặt',
  'capture.walk.gmail.settings': 'Cài đặt',
  'capture.walk.gmail.general': 'Chung',
  'capture.walk.gmail.labels': 'Nhãn',
  'capture.walk.gmail.filters': 'Bộ lọc và địa chỉ bị chặn',
  'capture.walk.gmail.forwarding': 'Chuyển tiếp và POP/IMAP',
  'capture.walk.gmail.forwardingHead': 'Chuyển tiếp:',
  'capture.walk.gmail.addAddress': 'Thêm địa chỉ chuyển tiếp',
  'capture.walk.gmail.enterAddress': 'Vui lòng nhập địa chỉ email chuyển tiếp mới:',
  'capture.walk.gmail.next': 'Tiếp theo',
  'capture.walk.gmail.cancel': 'Hủy',
  'capture.walk.gmail.proceed': 'Tiếp tục',
  'capture.walk.gmail.forwardTo': 'Chuyển tiếp email đến tới',
  'capture.walk.gmail.verify': 'Xác minh',
  'capture.walk.gmail.code': 'mã xác nhận',
  'capture.walk.gmail.disable': 'Tắt chuyển tiếp',
  'capture.walk.gmail.from': 'Từ',
  'capture.walk.gmail.subject': 'Chủ đề',
  'capture.walk.gmail.hasWords': 'Có các từ',
  'capture.walk.gmail.createFilter': 'Tạo bộ lọc',
  'capture.walk.gmail.search': 'Tìm kiếm',
  'capture.walk.gmail.whenArrives': 'Khi thư khớp chính xác với tiêu chí tìm kiếm của bạn:',
  'capture.walk.gmail.skipInbox': 'Bỏ qua Hộp thư đến (Lưu trữ)',
  'capture.walk.gmail.markRead': 'Đánh dấu là đã đọc',
  'capture.walk.gmail.forwardIt': 'Chuyển tiếp thư tới:',
  'capture.walk.gmail.inbox': 'Hộp thư đến',
};
