import type { Entry } from './catalogue-types';
import type { enAskActions } from './en-ask-actions';

export const viAskActions: { readonly [Key in keyof typeof enAskActions]: Entry } = {
  'ask.action.add': 'Thêm',
  'ask.action.notNow': 'Thôi',
  'ask.action.confirmSpend': 'Thêm {name}, {amount}, vào {category} nha?',
  'ask.action.added': 'Đã thêm. {name}, {amount}, đã tính vào hôm nay.',
  'ask.action.cancelled': 'Ok, không đổi gì nha.',
  'ask.action.failed': 'Chưa lưu được. Thử dùng Thêm nhanh nha.',
  'ask.action.confirmPot': 'Một hũ cho {name}: {goal}. Tạo luôn nha?',
  'ask.action.confirmPotBy': 'Một hũ cho {name}: {goal} trước {month}. Tạo luôn nha?',
  'ask.action.setUp': 'Tạo hũ',
  'ask.action.potLocked':
    'Bản miễn phí có một hũ riêng, và bạn đã dùng rồi. Max cho thêm nhiều hũ nữa.',
  'ask.action.seeMax': 'Xem Max',
  'ask.action.potGoal': '{name} cần bao nhiêu? Nói mình nghe, kiểu “10tr”.',
  'ask.action.showMe': 'Xem cách làm',
  'ask.action.openQuickAdd': 'Mở Thêm nhanh',
  'ask.howTo.ways':
    'Có sáu cách: Thêm nhanh (gõ hoặc nói), chia sẻ biên lai ngân hàng vào 6pm, chuyển tiếp email hóa đơn, quét VietQR để trả, để Apple Pay tự ghi, và widget cùng nút điều khiển. Những gì 6pm tự bắt được sẽ chờ trong Inbox tới lúc chốt ngày.',
  'ask.howTo.quickAdd':
    'Thêm nhanh nhận khoản chi gõ vào hoặc nói ra, kiểu “trà sữa 45k”. Hoặc nói luôn với mình ở đây: “vừa ăn phở 50k”.',
  'ask.howTo.dailyNumber':
    'Con số mỗi ngày là tiền còn rảnh trong kỳ lương, sau hóa đơn, bạn của tương lai và các hũ, chia đều cho số ngày tới lương. Tiêu ít hơn thì mai tăng; tiêu lố thì mai giảm một chút.',
  'ask.howTo.negative':
    'Con số âm khi kỳ này đã tiêu nhiều hơn số tiền rảnh. Không sao đâu: kế hoạch sẽ chia phần đó cho những ngày còn lại. Bớt chi vài hôm, hoặc lấy bớt từ một hũ trong Kế hoạch.',
  'ask.howTo.pot':
    'Hũ là tiền để dành riêng cho một việc, như chuyến đi hay Tết. Mỗi tháng 6pm bỏ vào một ít và để nó ngoài con số mỗi ngày, tới lúc cần là có.',
  'ask.howTo.close':
    '6 giờ chiều bạn chốt ngày: giữ hoặc bỏ những khoản đã bắt được, rồi xem mình đang ở đâu. Lỡ không chốt cũng không mất gì; các khoản bắt được vẫn chờ, và vẫn được tính, tới khi bạn quyết.',
  'ask.howTo.budget':
    '6pm không chia ngân sách theo danh mục. Con số mỗi ngày chính là ngân sách: hóa đơn, bạn của tương lai và các hũ đã được trừ sẵn. Muốn bớt chi cho món gì, hãy tạo một hũ hoặc để dành thêm cho bạn của tương lai trong Kế hoạch.',
};
