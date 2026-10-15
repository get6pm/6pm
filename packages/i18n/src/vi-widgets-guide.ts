import type { Entry } from './catalogue-types';
import type { enWidgetsGuide } from './en-widgets-guide';

export const viWidgetsGuide: { readonly [Key in keyof typeof enWidgetsGuide]: Entry } = {
  'widgetsGuide.title': 'Tiện ích & điều khiển',
  'widgetsGuide.headline': '6pm, chỉ một cái liếc hay một lần bấm.',
  'widgetsGuide.lede':
    'Để số tiêu được hôm nay ở chỗ bạn vẫn nhìn, và mở Quét QR hay Thêm nhanh mà không cần tìm app.',
  'widgetsGuide.lookMax': 'Vẽ theo giao diện của bạn.',
  'widgetsGuide.lookFree': 'Miễn phí, màu Golden Hour. Có Max thì theo giao diện của bạn.',
  'widgetsGuide.howToAdd': 'Cách thêm',
  'widgetsGuide.whenItShows': 'Khi nào hiện',

  'widgetsGuide.home.title': 'Tiện ích Màn hình chính',
  'widgetsGuide.home.what': 'Liếc là thấy số tiêu được hôm nay. Chạm để mở 6pm.',
  'widgetsGuide.home.small': 'Nhỏ',
  'widgetsGuide.home.medium': 'Vừa',
  'widgetsGuide.home.large': 'Lớn',
  'widgetsGuide.home.smallWhat': 'Số tiêu được hôm nay của bạn.',
  'widgetsGuide.home.mediumWhat': 'Con số, kèm nút Quét QR và Thêm nhanh bên cạnh.',
  'widgetsGuide.home.largeWhat': 'Số còn lại, và các khoản chi mới nhất hôm nay.',
  'widgetsGuide.home.step1': 'Chạm và giữ một chỗ trống trên Màn hình chính đến khi các app rung.',
  'widgetsGuide.home.step2': 'Chạm Sửa ở góc trên, rồi Thêm tiện ích.',
  'widgetsGuide.home.step3': 'Tìm 6pm, vuốt tới cỡ bạn muốn, rồi chạm Thêm tiện ích.',

  'widgetsGuide.lock.title': 'Tiện ích Màn hình khoá',
  'widgetsGuide.lock.what': 'Xem hôm nay còn bao nhiêu mà không cần mở khoá.',
  'widgetsGuide.lock.ring': 'Vòng',
  'widgetsGuide.lock.card': 'Thẻ',
  'widgetsGuide.lock.step1': 'Chạm và giữ Màn hình khoá, rồi chạm Tuỳ chỉnh.',
  'widgetsGuide.lock.step2': 'Chọn Màn hình khoá, rồi chạm vào ô dưới đồng hồ.',
  'widgetsGuide.lock.step3': 'Chạm 6pm, rồi chọn vòng hoặc thẻ.',

  'widgetsGuide.control.title': 'Trung tâm điều khiển',
  'widgetsGuide.control.what': 'Vuốt xuống, chạm một lần là vào Quét QR hay Thêm nhanh.',
  'widgetsGuide.control.needs': 'iOS 18 trở lên',
  'widgetsGuide.control.step1': 'Vuốt xuống từ góc trên bên phải màn hình.',
  'widgetsGuide.control.step2': 'Chạm và giữ một chỗ trống, rồi chạm Thêm điều khiển.',
  'widgetsGuide.control.step3': 'Tìm 6pm và chọn Quét QR hoặc Thêm nhanh.',
  'widgetsGuide.control.note':
    'Hai nút này cũng thay được đèn pin hay camera ở cuối Màn hình khoá.',

  'widgetsGuide.action.title': 'Nút Tác vụ',
  'widgetsGuide.action.what': 'Nhấn giữ nút bên cạnh máy để mở Quét QR.',
  'widgetsGuide.action.needs': 'iPhone 15 Pro trở lên',
  'widgetsGuide.action.step1': 'Mở Cài đặt, rồi Nút Tác vụ.',
  'widgetsGuide.action.step2': 'Vuốt tới Điều khiển, rồi chạm tên điều khiển bên dưới.',
  'widgetsGuide.action.step3': 'Tìm 6pm và chọn Quét QR hoặc Thêm nhanh.',
  'widgetsGuide.action.note':
    'Thích nói hơn? Nói với Siri “Log in 6pm”, rồi số tiền (Siri chưa có tiếng Việt).',

  'widgetsGuide.live.title': 'Hoạt động trực tiếp',
  'widgetsGuide.live.what': 'Tự hiện khi một khoản trả QR đang chờ, và khi bạn đi du lịch.',
  'widgetsGuide.live.step1':
    'Quét QR rồi trả trong app ngân hàng. Khoản đó chờ ngay trên Màn hình khoá.',
  'widgetsGuide.live.step2': 'Chạm Đã trả khi tiền đã đi. Nó tự đóng.',
  'widgetsGuide.live.step3': 'Không thấy? Vào Cài đặt, mở 6pm và bật Hoạt động trực tiếp.',
};
