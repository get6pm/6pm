import type { Entry } from './catalogue-types';
import type { enAskLedger } from './en-ask-ledger';

export const viAskLedger: { readonly [Key in keyof typeof enAskLedger]: Entry } = {
  'ask.range.today': 'hôm nay',
  'ask.range.yesterday': 'hôm qua',
  'ask.range.thisWeek': 'tuần này',
  'ask.range.lastWeek': 'tuần trước',
  'ask.range.thisCycle': 'từ ngày lương',
  'ask.range.lastCycle': 'kỳ lương trước',
  'ask.range.thisMonth': 'tháng này',
  'ask.range.lastMonth': 'tháng trước',
  'ask.range.last7Days': 'trong tuần qua',
  'ask.range.last30Days': 'trong tháng qua',
  'ask.range.dates': 'từ {from} đến {to}',

  'ask.answer.spent': { other: 'Bạn đã tiêu {total} {range}, {count} khoản.' },
  'ask.answer.spentOn': { other: 'Bạn đã tiêu {total} cho {category} {range}, {count} lần.' },
  'ask.answer.spentAt': { other: 'Bạn đã tiêu {total} ở {merchant} {range}, {count} lần.' },
  'ask.answer.spentNone': 'Không tiêu gì {range}.',
  'ask.answer.spentNoneOn': 'Không có khoản nào cho {category} {range}.',
  'ask.answer.spentNoneAt': 'Không có khoản nào ở {merchant} {range}.',
  'ask.answer.breakdown': 'Trong {total} {range}, nhiều nhất là {top}.',
  'ask.answer.compared.up': 'Là {now} {range}, tăng so với {before} {against}.',
  'ask.answer.compared.down': 'Là {now} {range}, giảm so với {before} {against}.',
  'ask.answer.compared.same': 'Gần như bằng nhau: {now} {range}, {before} {against}.',
  'ask.answer.listed': { other: '{count} khoản {range}, tổng {total}.' },
  'ask.answer.listedMore': 'Và {more} khoản nữa.',
  'ask.answer.listedNone': 'Không có khoản nào như vậy {range}.',
  'ask.answer.bills': { other: 'Còn {count} hóa đơn trước ngày lương, tổng {total}.' },
  'ask.answer.billsNone': 'Không còn hóa đơn nào trước ngày lương.',
  'ask.answer.how': 'Đây là điều đáng chú ý lúc này.',
  'ask.answer.howNothing': 'Mọi thứ êm ả. Chưa có gì nổi bật.',
  'ask.answer.noSuchCategory': 'Mình không thấy danh mục {category}. Hỏi về danh mục của bạn nha.',
  'ask.answer.noRange': 'Chưa có gì để xem cho khoảng đó.',
  'ask.answer.chat': 'Có gì cứ hỏi mình nha, lúc nào cũng được.',
  'ask.answer.partial': 'Chỉ tính những gì 6pm có từ {since}.',
  'ask.row.total': 'Tổng',
  'ask.row.before': 'Trước đó',
  'ask.answer.goalPace.months': {
    other:
      'Với {monthly} mỗi tháng cho bạn của tương lai, {amount} cho {what} mất khoảng {count} tháng, tầm {month}.',
  },
  'ask.answer.goalPace.years': {
    other:
      'Với {monthly} mỗi tháng cho bạn của tương lai, {amount} cho {what} mất khoảng {count} năm, tầm {month}.',
  },
  'ask.answer.goalPace.note': 'Tạo riêng một hũ cho nó để tiền không lẫn vào chỗ khác nha.',
  'ask.answer.goalNoPace':
    'Hiện mỗi tháng chưa có khoản nào cho bạn của tương lai, nên chưa tính được bao lâu để có {amount} cho {what}. Mỗi tháng một ít là bắt đầu rồi.',
  'ask.answer.goalAmount': '{what} tầm bao nhiêu tiền? Nói mình giá, kiểu “3 tỷ”, mình tính cho.',
  'ask.row.reachedBy': 'Khoảng',
};
