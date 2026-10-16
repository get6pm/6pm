import type { Entry } from './catalogue-types';
import type { enDuo } from './en-duo';

export const viDuo: { readonly [Key in keyof typeof enDuo]: Entry } = {
  'duo.month.steady': 'Đúng nhịp. Cứ thong thả.',
  'duo.month.fast': 'Tiêu hơi nhanh hơn số ngày.',
  'duo.month.paceLine': 'Đã dùng {used}% tiền {month}, thời gian đã qua {gone}%.',
  'duo.month.daily': 'Con số mỗi ngày',
  'duo.day.ofLine': 'trên {line} của ngày đó',
  'duo.day.previous': 'Ngày trước',
  'duo.day.next': 'Ngày sau',
  'duo.ask.title': 'Nếu bạn tiêu {amount}',
  'duo.ask.from': 'xem trước từ Hỏi',
  'duo.ask.spent': 'đã tiêu {spent} · thêm ~{amount}',
  'duo.ask.left': 'còn {left}',
  'duo.close.kept': 'Đã giữ hôm nay',
  'duo.close.ofLine': 'trên {line} hôm nay · còn {left} là của bạn',
  'duo.close.foldLater': 'Chọn từng khoản, rồi gập máy lại để chốt ngày.',
  'duo.close.foldNow': 'Gập máy lại để chốt ngày.',
  'duo.market.title': 'Ở quầy',
  'duo.market.left': 'Hôm nay còn',
  'duo.market.add': 'Thêm',
  'duo.market.leave': 'Rời quầy',
  'duo.scan.camera': 'Camera trong',
  'duo.scan.looking': 'Đang tìm mã QR',
  'duo.scan.stand': 'Dựng máy trên quầy và đưa mã QR của quán lên nửa trên.',
  'duo.scan.to': 'cho {payee}',
  'duo.scan.paid': 'Đã trả',
};
