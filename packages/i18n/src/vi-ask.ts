import type { Entry } from './catalogue-types';
import type { enAsk } from './en-ask';

export const viAsk: { readonly [Key in keyof typeof enAsk]: Entry } = {
  'ask.title': 'Hỏi 6pm',
  'ask.sub': 'Có đủ không, nếu như, khi nào đủ',
  'ask.back': 'Quay lại',
  'ask.intro':
    'Hỏi mình xem khoản nào vừa túi, một khoản lớn đổi những ngày sau ra sao, hay khi nào hũ đầy. Mình sẽ cho bạn xem phép tính.',
  'ask.try': 'Thử hỏi',
  'ask.placeholder': 'Mình mua nổi…',
  'ask.send': 'Gửi',
  'ask.suggest.afford': 'Thứ Bảy ăn tối {amount} được không?',
  'ask.suggest.weekend': 'Cuối tuần này chi được bao nhiêu?',
  'ask.suggest.spend': 'Nếu mua áo khoác {amount} thì sao?',
  'ask.suggest.pot': 'Khi nào đủ tiền {pot}?',
  'ask.suggest.save': 'Có nên để dành thêm không?',
  'ask.meter': 'Còn {left}/{total} câu hỏi miễn phí tuần này',
  'ask.unlimitedWith': 'Không giới hạn với',
  'ask.locked.title': 'Hết {total} câu hỏi của tuần này',
  'ask.locked.sub': 'Thứ Hai có thêm, hoặc không giới hạn với Max',
  'ask.locked.cta': 'Lấy Max',
  'ask.bar.now': 'Bây giờ',
  'ask.bar.after': 'Sau đó',
  'ask.bar.perDay': '{amount}/ngày',
  'ask.bar.nothing': 'hết sạch',
  'ask.row.free': 'Còn tự do đến ngày lương',
  'ask.row.this': 'Khoản này',
  'ask.row.leftPerDay': 'Còn lại mỗi ngày',
  'ask.row.safeToday': 'Chi được hôm nay',
  'ask.row.tomorrow': 'Ngày mai',
  'ask.row.futureYou': 'Future you mỗi tháng',
  'ask.row.moving': 'Để dành thêm',
  'ask.row.inPot': 'Trong hũ',
  'ask.row.goal': 'Mục tiêu',
  'ask.row.perMonth': 'Mỗi tháng',
  'ask.answer.fitsToday': 'Được, dễ thôi. Nằm gọn trong {safe} của hôm nay nên ngày mai không đổi.',
  'ask.answer.fits': 'Được. Những ngày sau từ {from} còn {to} đến ngày lương.',
  'ask.answer.tight': 'Được, nhưng sát: những ngày sau giảm từ {from} xuống {to}.',
  'ask.answer.tight.pots': 'Lấy {take} từ các hũ thì mỗi ngày vẫn giữ được {withPots}.',
  'ask.answer.notThisMonth':
    'Tháng này chưa được. Khoản này nhiều hơn toàn bộ tiền tự do của bạn. Sau ngày lương {payday} thì được.',
  'ask.answer.notThisMonth.pots': 'Hoặc lấy một phần từ một hũ.',
  'ask.answer.weekend.two':
    'Khoảng {total} cho {first} và {second}, nếu những ngày trước đó đúng kế hoạch.',
  'ask.answer.weekend.one': 'Khoảng {total} cho {first}, nếu những ngày trước đó đúng kế hoạch.',
  'ask.answer.weekend.none':
    'Ngày lương {payday} đến trước cuối tuần, nên con số mới bắt đầu từ ngày đó.',
  'ask.answer.saveMore':
    'Để dành thêm {amount} cho Future you sẽ tốn khoảng {perDay} mỗi ngày đến ngày lương.',
  'ask.answer.saveMore.none':
    'Để dành thêm {amount} cho Future you gần như không đổi những ngày của bạn.',
  'ask.answer.saveMore.note': 'Bạn có thể làm việc này trong Kế hoạch.',
  'ask.answer.potFull': 'Mỗi tháng {monthly}, hũ {pot} sẽ đầy vào {month}.',
  'ask.answer.potFull.done': 'Hũ {pot} đã đầy rồi.',
  'ask.answer.potFull.idle':
    'Hiện chưa có khoản nào vào hũ {pot} mỗi tháng nên hũ sẽ không tự đầy.',
  'ask.answer.noSuchPot':
    'Mình không thấy hũ {pot}. Hỏi về một hũ của bạn, hoặc tạo nó trong Kế hoạch.',
  'ask.answer.noPots': 'Chưa có hũ nào. Tạo một hũ trong Kế hoạch, mình sẽ báo khi nào đầy.',
  'ask.answer.today': 'Hôm nay bạn chi được {safe}. Con số ngày mai là {tomorrow}.',
  'ask.answer.today.used': 'Con số hôm nay đã hết. Ngày mai là {tomorrow}.',
  'ask.answer.help':
    'Mình cho bạn biết khoản nào vừa túi, một khoản lớn đổi những ngày sau ra sao, hay khi nào hũ đầy. Thử hỏi “Thứ Bảy mình chi {amount} được không?”',
  'ask.error': 'Có trục trặc nên mình chưa trả lời được. Thử lại nhé.',
  'ask.answer.offline':
    'Mình không kết nối được máy chủ, nên lúc này chỉ đọc được câu hỏi đơn giản.',
} as const;
