import type { Entry } from './catalogue-types';
import type { enPrivacyAi } from './en-privacy-ai';

export const viPrivacyAi: { readonly [Key in keyof typeof enPrivacyAi]: Entry } = {
  'privacy.ai.title': '6pm nên suy nghĩ ở đâu?',
  'privacy.ai.sub':
    'Nơi xử lý câu hỏi và lời của bạn đồng hành. Đổi lại lúc nào cũng được trong Cài đặt.',
  'privacy.ai.server.title': 'Trên máy chủ, với Claude',
  'privacy.ai.server.text':
    'Trả lời sắc nhất, nghe tiếng Việt chuẩn nhất. Chỉ một câu hỏi hay vài thông tin rời khỏi máy, không bao giờ là danh sách chi tiêu.',
  'privacy.ai.server.tag': 'Nên dùng',
  'privacy.ai.device.title': 'Chỉ trên iPhone này',
  'privacy.ai.device.text':
    'Không gì liên quan AI rời khỏi máy. Tải mô hình về một lần, qua Wi-Fi.',
  'privacy.ai.device.unavailable': 'iPhone này không đủ bộ nhớ để chạy mô hình riêng.',
  'privacy.ai.models': 'Mô hình',
  'privacy.model.fast': 'Nhanh và nhẹ nhất',
  'privacy.model.words': 'Viết hay nhất',
  'privacy.model.reading': 'Hiểu câu hỏi tốt nhất',
  'privacy.model.size': '{size} GB',
  'privacy.model.download': 'Tải về',
  'privacy.model.downloading': '{percent}%',
  'privacy.model.verifying': 'Đang kiểm tra',
  'privacy.model.ready': 'Sẵn sàng',
  'privacy.model.failed': 'Thử lại',
  'privacy.model.delete': 'Xoá',
  'privacy.model.later': 'Cứ tiếp tục, mô hình sẽ tải trong lúc đó.',
  'settings.ai': 'AI',
  'settings.ai.server': 'Trên máy chủ',
  'settings.ai.device': 'Trên iPhone này',
  'privacy.leaves.title': 'Những gì rời khỏi máy',
  'privacy.leaves.server.ask': 'Câu hỏi, cùng tên danh mục và tên hũ, để hiểu câu hỏi',
  'privacy.leaves.server.lines': 'Vài thông tin trong một câu của bạn đồng hành',
  'privacy.leaves.server.receipts': 'Ảnh biên lai mà máy không tự đọc được',
  'privacy.leaves.server.voice': 'Giọng nói lúc bạn đang nói, để chuyển thành chữ',
  'privacy.leaves.device.none': 'Không gì liên quan AI. Mọi thứ được tính ngay trên iPhone này.',
  'privacy.leaves.device.network':
    'Tỷ giá (chỉ gửi ngày), bản cập nhật và mua hàng vẫn dùng internet.',
  'privacy.leaves.device.emails': 'Email biên lai tắt ở chế độ này.',
};
