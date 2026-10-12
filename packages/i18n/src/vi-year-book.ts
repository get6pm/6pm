import type { Entry } from './catalogue-types';
import type { enYearBook } from './en-year-book';

export const viYearBook: { readonly [Key in keyof typeof enYearBook]: Entry } = {
  'yearBook.binds': 'Đóng cuốn ngày 31/12. Mười hai cuốn nhật ký trong một.',
  'yearBook.bound': 'Đã đóng cuốn ngày 31/12. Chạm để chia sẻ bản PDF.',
  'yearBook.binding': 'Đang đóng cuốn sổ của bạn…',
  'yearBook.failed': 'Chưa đóng cuốn được. Thử lại chút nữa nha.',
  'yearBook.shareTitle': 'Cuốn sổ năm {year}',
  'yearBook.cover.kicker': '6PM · NHẬT KÝ TIỀN',
  'yearBook.cover.sub': { other: '{count} cuốn nhật ký tiền, đóng cuốn ngày 31/12.' },
  'yearBook.cover.closed': { other: '{count} NGÀY CHỐT LÚC 6PM' },
  'yearBook.summary.kicker': 'CUỐN SỔ CẢ NĂM · {year}',
  'yearBook.summary.headline.spare': 'Bạn khép lại năm {year} mà vẫn dư {amount}.',
  'yearBook.summary.headline.over': 'Năm nay hơi lố kế hoạch. Năm {next} làm lại từ đầu.',
  'yearBook.summary.futureYouSub': 'để dành trong năm',
  'yearBook.summary.contents': 'CÁC CUỐN NHẬT KÝ',
};
