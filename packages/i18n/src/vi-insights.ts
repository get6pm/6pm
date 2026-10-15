import type { Entry } from './catalogue-types';
import type { enInsights } from './en-insights';

// Same voice as the companion's other lines: "mình" for itself, "bạn" for you, Saigon texting.
// Roast teases the habit, never the person. A pot is a "hũ"; closing the day is "chốt ngày".
export const viInsights: { readonly [Key in keyof typeof enInsights]: Entry } = {
  'insight.compare.muchMore': 'nhiều hơn hẳn',
  'insight.compare.more': 'nhiều hơn',
  'insight.compare.about': 'gần như bằng',
  'insight.compare.less': 'ít hơn',
  'insight.compare.muchLess': 'ít hơn hẳn',

  'insight.todayOver.soft.1': 'Hôm nay lố {over}. Không sao đâu, mai còn {tomorrow}.',
  'insight.todayOver.soft.2':
    'Hôm nay hơi nhiều, lố {over}. Kế hoạch tự cân lại: mai còn {tomorrow}.',
  'insight.todayOver.cheeky.1': 'Lố {over} rồi nè. Mai còn {tomorrow}, làm lại từ đầu.',
  'insight.todayOver.cheeky.2': 'Hôm nay vượt vạch {over}. Bước ngoặt thôi, mai còn {tomorrow}.',
  'insight.todayOver.roast.1':
    'Lố {over}. Cái vạch cố lắm rồi đó. Mai còn {tomorrow}, nhẹ tay nha.',
  'insight.todayOver.roast.2':
    'Vạch nói không, hôm nay nói thêm {over}. Mai còn {tomorrow}, hiệp hai nha.',
  'insight.todayOver.plain': 'Hôm nay vượt mức {over}. Mức ngày mai là {tomorrow}.',

  'insight.todayUnder.soft.1': 'Mới tiêu {spent}, vẫn còn {safe} an toàn. Đều đều vậy là đẹp.',
  'insight.todayUnder.soft.2': 'Hôm nay vẫn còn {safe} nè. Bạn đang ổn lắm.',
  'insight.todayUnder.cheeky.1': 'Còn {safe} hôm nay. Xài khéo nha, hoặc để dành, tùy bạn.',
  'insight.todayUnder.cheeky.2': 'Đã {spent}, còn {safe}. Mượt ghê.',
  'insight.todayUnder.roast.1': 'Mới {spent} thôi hả? Ví cũng bất ngờ luôn. Còn {safe} an toàn nè.',
  'insight.todayUnder.roast.2': 'Còn {safe} an toàn. Hơi đáng nghi, nhưng cứ vậy nha.',
  'insight.todayUnder.plain': 'Hôm nay đã tiêu {spent}, còn {safe} an toàn.',

  'insight.noSpendYet.soft.1': 'Chưa tiêu gì hết. Cả {line} hôm nay vẫn là của bạn.',
  'insight.noSpendYet.soft.2': 'Trang mới tinh: {line} cho hôm nay.',
  'insight.noSpendYet.cheeky.1': 'Chưa đồng nào. {line} có ngứa tay chưa?',
  'insight.noSpendYet.cheeky.2': 'Nguyên {line} hôm nay, chưa đụng tới. Tạm thời thôi.',
  'insight.noSpendYet.roast.1': 'Chưa tiêu gì. {line} đang chờ coi bạn tính sao.',
  'insight.noSpendYet.roast.2': '{line} nằm im chưa ai đụng. Đáng nghi ghê, cứ giữ vậy nha.',
  'insight.noSpendYet.plain': 'Chưa tiêu gì. Mức hôm nay là {line}.',

  'insight.waitingTonight.soft.1': {
    other: '{count} khoản ({amount}) chờ tối nay chốt. Một phút là xong.',
  },
  'insight.waitingTonight.soft.2': { other: 'Tối nay xem lại {count} khoản, tổng {amount} nha.' },
  'insight.waitingTonight.cheeky.1': {
    other: '{count} khoản ({amount}) đang chờ bạn phán xử tối nay.',
  },
  'insight.waitingTonight.cheeky.2': {
    other: 'Chốt ngày tối nay: {count} khoản, {amount}. Dễ ợt.',
  },
  'insight.waitingTonight.roast.1': {
    other: '{count} khoản, {amount}, đang chờ. Tụi nó không tự chốt đâu, một phút là xong.',
  },
  'insight.waitingTonight.roast.2': {
    other: '{count} khoản, {amount}, đang chờ bạn nói “ừ, của mình đó”.',
  },
  'insight.waitingTonight.plain': { other: '{count} khoản ({amount}) chờ chốt ngày tối nay.' },

  'insight.paydaySoon.soft.1': { other: 'Còn {count} ngày nữa là lãnh lương. Sắp tới rồi.' },
  'insight.paydaySoon.soft.2': { other: 'Còn {count} ngày tới ngày lương, {payday}. Cố lên nha.' },
  'insight.paydaySoon.cheeky.1': { other: 'Còn {count} ngày là có lương. Ngửi thấy mùi rồi.' },
  'insight.paydaySoon.cheeky.2': { other: 'Ngủ thêm {count} giấc nữa là có lương.' },
  'insight.paydaySoon.roast.1': { other: 'Còn {count} ngày tới lương. Giữ vững nha.' },
  'insight.paydaySoon.roast.2': { other: 'Lương về ngày {payday}. Kéo khóa ví lại tới đó nha.' },
  'insight.paydaySoon.plain': { other: 'Còn {count} ngày tới ngày lương, {payday}.' },

  'insight.billDueToday.soft.1': 'Hôm nay tới hạn {bill} ({amount}) nha.',
  'insight.billDueToday.soft.2': 'Nhắc nhẹ: {bill}, {amount}, tới hạn hôm nay.',
  'insight.billDueToday.cheeky.1': '{bill} đòi {amount} hôm nay nè.',
  'insight.billDueToday.cheeky.2': 'Khách mời hôm nay: {bill}, {amount}.',
  'insight.billDueToday.roast.1': '{bill} tới hạn hôm nay. Nó không chờ đâu.',
  'insight.billDueToday.roast.2': '{amount} cho {bill}, ngay hôm nay. Đừng lơ nó nha.',
  'insight.billDueToday.plain': '{bill} ({amount}) tới hạn hôm nay.',

  'insight.billDue.soft.1': { other: '{bill} ({amount}) tới hạn trong {count} ngày nữa.' },
  'insight.billDue.soft.2': { other: 'Nhắc nhẹ: {bill}, {amount}, còn {count} ngày.' },
  'insight.billDue.cheeky.1': { other: '{count} ngày nữa {bill} tới đòi {amount}.' },
  'insight.billDue.cheeky.2': { other: 'Còn {count} ngày: {bill}, {amount}. Ghi nhớ nha.' },
  'insight.billDue.roast.1': { other: '{count} ngày nữa {bill} đòi {amount}. Như mọi khi.' },
  'insight.billDue.roast.2': {
    other: '{amount} cho {bill} trong {count} ngày. Đừng giả bộ bất ngờ.',
  },
  'insight.billDue.plain': { other: '{bill} ({amount}) tới hạn trong {count} ngày.' },

  'insight.categoryPaceUp.soft.1': '{category} kỳ này đã {now}, {compare} so với lúc này kỳ trước.',
  'insight.categoryPaceUp.soft.2':
    '{category} đang chạy nhanh: mới đó đã {now}, kỳ trước {before}.',
  'insight.categoryPaceUp.cheeky.1':
    '{category}: đã {now} rồi. Kỳ trước lúc này mới {before}. Hừm.',
  'insight.categoryPaceUp.cheeky.2': '{category} đang lên hương: {now} so với {before}.',
  'insight.categoryPaceUp.roast.1':
    '{category} đã {now}. Kỳ trước: {before}. Mình thấy hết nha, tuần sau nhẹ lại là cân.',
  'insight.categoryPaceUp.roast.2':
    'Đã {now} cho {category}, kỳ trước {before}. Nói vậy thôi, thương mới nói.',
  'insight.categoryPaceUp.plain': '{category}: kỳ này {now}, cùng lúc kỳ trước {before}.',

  'insight.categoryPaceDown.soft.1': '{category} giảm còn {now}, kỳ trước {before}. Dễ thương ghê.',
  'insight.categoryPaceDown.soft.2': '{category} {compare} kỳ trước: {now} so với {before}.',
  'insight.categoryPaceDown.cheeky.1': '{category}: {now}, giảm từ {before}. Giỏi dữ ta.',
  'insight.categoryPaceDown.cheeky.2': '{category} đi ăn kiêng rồi: {now} so với {before}.',
  'insight.categoryPaceDown.roast.1':
    '{category} chỉ {now}? Kỳ trước {before} lận. Giữ phong độ này nha.',
  'insight.categoryPaceDown.roast.2': '{now} cho {category}, giảm từ {before}. Trưởng thành rồi.',
  'insight.categoryPaceDown.plain': '{category}: kỳ này {now}, cùng lúc kỳ trước {before}.',

  'insight.repeatMerchant.soft.1':
    'Tuần này ghé {merchant} {visits} lần rồi. Chắc quán thương bạn lắm.',
  'insight.repeatMerchant.soft.2': '{visits} lần ghé {merchant} từ thứ Hai, tổng {amount}.',
  'insight.repeatMerchant.cheeky.1':
    'Lại {merchant} nữa hả? Từ thứ Hai tới giờ {visits} lần rồi nè.',
  'insight.repeatMerchant.cheeky.2': 'Bạn với {merchant}: {visits} lần hẹn tuần này, {amount}.',
  'insight.repeatMerchant.roast.1': '{merchant}, lần thứ {visits}. Quán thuộc tên bạn chưa?',
  'insight.repeatMerchant.roast.2':
    '{amount} ở {merchant} tuần này. {visits} lần. Thành lối sống luôn rồi.',
  'insight.repeatMerchant.plain': '{merchant}: {visits} lần tuần này, {amount}.',

  'insight.firstTimeMerchant.soft.1': 'Lần đầu ghé {merchant}. Mong là ngon nha.',
  'insight.firstTimeMerchant.soft.2': 'Chỗ mới nè: {merchant}, {amount}.',
  'insight.firstTimeMerchant.cheeky.1': '{merchant}? Chỗ mới. Mạo hiểm ghê.',
  'insight.firstTimeMerchant.cheeky.2': 'Ồ, {merchant}. Chỗ này lạ nha.',
  'insight.firstTimeMerchant.roast.1': '{merchant}. Chỗ mới, ví cũ.',
  'insight.firstTimeMerchant.roast.2':
    'Lần đầu ghé {merchant}. Đừng thành thói quen nha. Hoặc cứ thành.',
  'insight.firstTimeMerchant.plain': 'Khoản đầu tiên ở {merchant}: {amount}.',

  'insight.biggestSpend.soft.1': 'Khoản lớn của tuần: {amount} ở {merchant}.',
  'insight.biggestSpend.soft.2': '{merchant}, {amount}: lớn nhất tuần này. Kế hoạch lo được.',
  'insight.biggestSpend.cheeky.1': 'Tâm điểm tuần này: {merchant}, {amount}.',
  'insight.biggestSpend.cheeky.2': '{amount} ở {merchant}. Tự thưởng hả, hiểu rồi.',
  'insight.biggestSpend.roast.1': '{amount} ở {merchant}. Nhân vật chính của tuần.',
  'insight.biggestSpend.roast.2':
    '{merchant} lấy {amount} tuần này. Đáng không? Khỏi trả lời, kế hoạch lo được.',
  'insight.biggestSpend.plain': 'Khoản lớn nhất tuần này: {amount} ở {merchant}.',

  'insight.underStreak.soft.1': '{days} ngày liền dưới mức. Bạn vững ghê.',
  'insight.underStreak.soft.2': '{days} ngày êm ả liên tiếp.',
  'insight.underStreak.cheeky.1': '{days} ngày dưới mức. Thời kỳ chuỗi đẹp.',
  'insight.underStreak.cheeky.2': 'Dưới mức {days} ngày liền. Đừng nói gở nha.',
  'insight.underStreak.roast.1':
    '{days} ngày dưới mức. Mình soạn sẵn câu chọc rồi mà không dùng được.',
  'insight.underStreak.roast.2': '{days} ngày liền. Mình sắp hết chuyện để chọc rồi.',
  'insight.underStreak.plain': '{days} ngày đã chốt liên tiếp ở mức hoặc dưới mức.',

  'insight.closeStreak.soft.1': '{days} ngày chốt liền. Đó chính là thói quen nè.',
  'insight.closeStreak.soft.2': 'Chuỗi chốt ngày {days} ngày. Cảm ơn bạn đã ghé mỗi tối.',
  'insight.closeStreak.cheeky.1': 'Chốt {days} ngày liền. Mở khóa thói quen.',
  'insight.closeStreak.cheeky.2': 'Chuỗi: {days}. Tối nay thêm một nữa.',
  'insight.closeStreak.roast.1': 'Chốt liền {days} ngày không sót buổi nào. Giữ chuỗi nha.',
  'insight.closeStreak.roast.2': 'Chốt liền {days} ngày. Giờ mà đứt là tiếc lắm.',
  'insight.closeStreak.plain': 'Đã chốt {days} ngày liên tiếp.',

  'insight.weekSpare.soft.1': { other: 'Tuần này dư {spare}. Phần dư chuyển sang những ngày tới.' },
  'insight.weekSpare.soft.2': { other: 'Dư {spare} tuần này, mang theo cho mấy ngày sau.' },
  'insight.weekSpare.cheeky.1': {
    other: 'Dư {spare} từ {count} ngày ngoan. Mấy ngày sau cảm ơn bạn.',
  },
  'insight.weekSpare.cheeky.2': { other: 'Tuần này đang dư {spare}. Mượt.' },
  'insight.weekSpare.roast.1': {
    other: '{count} ngày dưới mức, dư {spare}. Đừng xài một lần hết nha.',
  },
  'insight.weekSpare.roast.2': { other: 'Tuần này dư {spare}. Thôi được, cho qua.' },
  'insight.weekSpare.plain': { other: 'Các ngày đã chốt tuần này dư {spare}.' },

  'insight.weekOver.soft.1': 'Tuần này lố {over}. Mấy ngày tới nhỏ lại chút, vậy cũng ổn mà.',
  'insight.weekOver.soft.2': 'Tuần này lố {over}. Mình cùng cân lại nha.',
  'insight.weekOver.cheeky.1': 'Tuần lố {over}. Phần còn lại của tháng tự chỉnh.',
  'insight.weekOver.cheeky.2': 'Lố {over} tới giờ. Bước ngoặt thôi, chưa phải kết.',
  'insight.weekOver.roast.1': 'Tuần này lố {over}. Tuần sau nhẹ lại là tháng vẫn ổn.',
  'insight.weekOver.roast.2': 'Lố {over}. Tuần để quên, tháng để sửa.',
  'insight.weekOver.plain': 'Các ngày đã chốt tuần này vượt mức {over}.',

  'insight.potMilestone.soft.1': 'Hũ {pot} đã qua {percent}%. Lớn dần rồi nè.',
  'insight.potMilestone.soft.2': 'Đã được {percent}% đường tới hũ {pot}.',
  'insight.potMilestone.cheeky.1': 'Hũ {pot}: {percent}% rồi. Sắp thành thật rồi.',
  'insight.potMilestone.cheeky.2': 'Xong {percent}% hũ {pot}. Cho nó ăn tiếp nha.',
  'insight.potMilestone.roast.1': 'Hũ {pot} {percent}% rồi. Hũ đang thắng, cứ để nó thắng.',
  'insight.potMilestone.roast.2': '{percent}% tới hũ {pot}. Đừng có cạy nha.',
  'insight.potMilestone.plain': 'Hũ {pot} đã qua {percent}% mục tiêu.',

  'insight.potFull.soft.1': 'Hũ {pot} đầy rồi. Bạn làm được đó.',
  'insight.potFull.soft.2': 'Hũ {pot}: xong. Tận hưởng thật trọn nha.',
  'insight.potFull.cheeky.1': 'Hũ {pot} đầy rồi! Tung hoa, nhưng nhỏ nhỏ thôi.',
  'insight.potFull.cheeky.2': 'Hũ {pot}, đầy tới miệng.',
  'insight.potFull.roast.1': 'Hũ {pot} đầy rồi. Mình soạn sẵn câu chọc mà bạn không cần tới.',
  'insight.potFull.roast.2': 'Hũ đầy: {pot}. Giờ dùng đúng cho việc đã định nha.',
  'insight.potFull.plain': 'Hũ {pot} đã đạt mục tiêu.',

  'insight.workToClaim.soft.1': { other: '{count} khoản công việc ({amount}) chờ bạn đòi lại.' },
  'insight.workToClaim.soft.2': {
    other: '{amount} tiền công việc, {count} khoản, đang chờ đòi lại.',
  },
  'insight.workToClaim.cheeky.1': { other: 'Công ty đang nợ bạn {amount}. {count} hóa đơn lận.' },
  'insight.workToClaim.cheeky.2': { other: '{count} khoản công việc, {amount}. Đi đòi đi.' },
  'insight.workToClaim.roast.1': { other: 'Công ty nợ bạn {amount}. {count} lần. Đừng ngại.' },
  'insight.workToClaim.roast.2': { other: 'Bạn đang bao công ty {amount}. Đòi lại đi.' },
  'insight.workToClaim.plain': { other: '{count} khoản công việc ({amount}) đang chờ đòi lại.' },
};
