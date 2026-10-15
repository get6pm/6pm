import type { Entry } from './catalogue-types';
import type { enInsightsHabits } from './en-insights-habits';

// Same voice as `vi-insights`: "mình" for itself, "bạn" for you, Saigon texting, one slang word
// at most. Roast teases the purchase or the pattern, never the person.
export const viInsightsHabits: { readonly [Key in keyof typeof enInsightsHabits]: Entry } = {
  'insight.noSpendDay.soft.1': 'Một ngày không tiêu đồng nào: nguyên {kept} vẫn còn đó.',
  'insight.noSpendDay.soft.2': 'Ngày không tiêu. Giữ được {kept}, nhẹ nhàng ghê.',
  'insight.noSpendDay.cheeky.1': 'Không tiêu đồng nào, {kept} còn nguyên. Ví được nghỉ một bữa.',
  'insight.noSpendDay.cheeky.2': 'Cả ngày chưa chi đồng nào. {kept} cảm ơn bạn nha.',
  'insight.noSpendDay.roast.1': 'Không tiêu gì, {kept} còn nguyên. Ủa ai đây? Ở lại lâu lâu nha.',
  'insight.noSpendDay.roast.2':
    'Cả ngày không chi đồng nào, giữ được {kept}. Mấy quán vẫn ổn, yên tâm.',
  'insight.noSpendDay.plain': 'Ngày đã chốt gần nhất không có khoản chi nào; giữ được {kept}.',

  'insight.noSpendStreak.soft.1': '{days} ngày liền ví được nghỉ: {kept} vẫn còn nguyên.',
  'insight.noSpendStreak.soft.2': '{days} ngày không tiêu gì. {kept} vẫn ở lại với bạn.',
  'insight.noSpendStreak.cheeky.1': '{days} ngày không chi đồng nào, ví bắt đầu nghi ngờ rồi.',
  'insight.noSpendStreak.cheeky.2': '{days} ngày liền không tiêu. {kept} đang đi nghỉ dưỡng.',
  'insight.noSpendStreak.roast.1':
    '{days} ngày không một khoản chi. Quán cà phê quen bắt đầu lo rồi.',
  'insight.noSpendStreak.roast.2':
    '{days} ngày không tiêu, {kept} còn nguyên. Cứ tự nhiên, tiếp tục nha.',
  'insight.noSpendStreak.plain':
    '{days} ngày đã chốt liên tiếp không có khoản chi; giữ được {kept}.',

  'insight.backUnder.soft.1': 'Lố một hôm rồi về lại dưới mức, dư {spare}. Giỏi lắm.',
  'insight.backUnder.soft.2': 'Một ngày lố, một ngày dư {spare}. Nhịp vậy là ổn.',
  'insight.backUnder.cheeky.1': 'Quay xe thành công: về dưới mức, dư {spare}.',
  'insight.backUnder.cheeky.2': 'Hôm trước lố, hôm sau dư {spare}. Cân bằng ghê.',
  'insight.backUnder.roast.1': 'Dư {spare} ngay sau một ngày lố. Lời xin lỗi được chấp nhận.',
  'insight.backUnder.roast.2': 'Về dưới mức, dư {spare}. Màn chuộc lỗi thành công.',
  'insight.backUnder.plain': 'Về lại dưới mức sau một ngày vượt, dư {spare}.',

  'insight.logGap.soft.1': 'Từ {since} chưa ghi gì, yên ả hay bận quá?',
  'insight.logGap.soft.2': '{days} ngày rồi chưa ghi khoản nào. Có gì cần thêm không nè?',
  'insight.logGap.cheeky.1': 'Từ {since} tới giờ trống trơn. Tu thật hay quên ghi?',
  'insight.logGap.cheeky.2': '{days} ngày không ghi gì. Ví đi du lịch hả?',
  'insight.logGap.roast.1': 'Từ {since} chưa ghi khoản nào. Không tiêu thật, hay chưa ghi?',
  'insight.logGap.roast.2': '{days} ngày im re. Một ly cà phê cũng tính nha, ghi vô là xong.',
  'insight.logGap.plain': 'Chưa ghi khoản chi nào từ {since}.',

  'insight.weekendHeavy.soft.1':
    'Dạo này cuối tuần mỗi ngày khoảng {weekend}, ngày thường {weekday}. Tính trước chút cho thứ Bảy nha.',
  'insight.weekendHeavy.soft.2':
    'Cuối tuần trung bình {weekend} một ngày, ngày thường {weekday}. Thong thả thôi.',
  'insight.weekendHeavy.cheeky.1':
    'Ngày thường {weekday}, cuối tuần {weekend}. Đầu tuần tu, cuối tuần xõa.',
  'insight.weekendHeavy.cheeky.2':
    'Cuối tuần trung bình {weekend}, ngày thường {weekday}. Thứ Bảy có kế hoạch cho bạn rồi.',
  'insight.weekendHeavy.roast.1':
    'Ngày thường {weekday}, cuối tuần {weekend}. Cuối tuần thắng hoài, lần này hòa được không?',
  'insight.weekendHeavy.roast.2':
    'Cuối tuần: {weekend} một ngày. Ngày thường: {weekday}. Cuối tuần này phục thù nha?',
  'insight.weekendHeavy.plain':
    'Bốn tuần qua: cuối tuần {weekend} một ngày, ngày thường {weekday}.',

  'insight.recordDay.soft.1':
    'Hôm nay {amount}, nhiều nhất trong {days} ngày. Không sao, mai làm lại.',
  'insight.recordDay.soft.2':
    '{amount} hôm nay là ngày nhiều nhất trong {days} ngày. Kế hoạch tự cân lại được.',
  'insight.recordDay.cheeky.1': '{amount} hôm nay. Đỉnh mới, mà đỉnh sai chỗ. Mai làm lại nha.',
  'insight.recordDay.cheeky.2':
    'Kỷ lục mới: {amount}, nhiều nhất trong {days} ngày. Đừng phá thêm lần nữa nha.',
  'insight.recordDay.roast.1':
    '{amount} trong một ngày, nhiều nhất {days} ngày qua. Gan ghê. Mai nhẹ lại nha.',
  'insight.recordDay.roast.2': 'Kỷ lục {days} ngày: {amount}. Đóng khung lại, rồi mai nghỉ ngơi.',
  'insight.recordDay.plain': 'Hôm nay chi {amount}, nhiều nhất một ngày trong {days} ngày qua.',

  'insight.likelySubscription.soft.1':
    '{merchant} có vẻ trừ khoảng {amount} mỗi tháng. Thêm vào hóa đơn nhé?',
  'insight.likelySubscription.soft.2':
    '{amount} cho {merchant}, {months} tháng liền. Thêm thành hóa đơn không nè?',
  'insight.likelySubscription.cheeky.1':
    'Lại {merchant}, {amount}, đều như đồng hồ. Lộ rồi nha gói tháng. Thêm vào hóa đơn nhé?',
  'insight.likelySubscription.cheeky.2':
    '{months} tháng {merchant}, mỗi lần {amount}. Còn dùng không? Thêm vào hóa đơn nha.',
  'insight.likelySubscription.roast.1':
    '{merchant}: {amount}, {months} tháng liền. Còn dùng thật, hay chỉ còn trả tiền?',
  'insight.likelySubscription.roast.2':
    'Tháng nào cũng {amount} cho {merchant}. Giữ thì thêm vào hóa đơn, không thì hủy nha.',
  'insight.likelySubscription.plain':
    '{merchant} trừ khoảng {amount} mỗi tháng, {months} tháng liền. Có thể thêm thành hóa đơn.',

  'insight.lateNight.soft.1': 'Đơn khuya {amount} ở {merchant}. Mong là đáng nha.',
  'insight.lateNight.soft.2': '{merchant}, {amount}, lúc khuya. Ngủ ngon nha.',
  'insight.lateNight.cheeky.1': '{amount} ở {merchant} lúc nửa đêm. Cú đêm chốt đơn ghê.',
  'insight.lateNight.cheeky.2': '{merchant} lúc khuya, {amount}. Kinh điển.',
  'insight.lateNight.roast.1':
    '{amount} ở {merchant} giữa đêm. Quyết định lớn thì để sáng mai hẵng tính nha.',
  'insight.lateNight.roast.2': '{merchant} lúc khuya, {amount}. Lần sau ngủ một giấc rồi hẵng mua.',
  'insight.lateNight.plain': 'Một khoản chi lúc khuya: {amount} ở {merchant}.',

  'insight.cycleHalfway.soft.1': 'Nửa kỳ lương rồi: đã dùng {percent}%, còn {left}.',
  'insight.cycleHalfway.soft.2': 'Qua nửa kỳ, vẫn còn {left}. Bạn theo dõi đều vậy là giỏi rồi.',
  'insight.cycleHalfway.cheeky.1': 'Hết hiệp một. Tỉ số: dùng {percent}%, còn {left} để chơi.',
  'insight.cycleHalfway.cheeky.2': 'Đi được nửa đường. Còn {left} cho hiệp hai.',
  'insight.cycleHalfway.roast.1':
    'Hết hiệp một: dùng {percent}%. Còn {left} cho hiệp hai, đá khéo nha.',
  'insight.cycleHalfway.roast.2': 'Nửa kỳ, đã đi {percent}%, còn {left}. Hiệp hai quyết định hết.',
  'insight.cycleHalfway.plain': 'Đã qua nửa kỳ lương: dùng {percent}%, còn {left}.',

  'insight.firstWeekPaceUp.soft.1':
    'Tuần đầu đã dùng {percent}% kỳ lương, chia đều là {even}%. Mấy tuần sau cân lại được.',
  'insight.firstWeekPaceUp.soft.2':
    'Tuần đầu hơi nhiều: {percent}% tiền của kỳ. Vài ngày nhẹ nhàng sẽ kéo lại.',
  'insight.firstWeekPaceUp.cheeky.1':
    'Tuần đầu: đi {percent}%, chia đều chỉ {even}%. Đầu kỳ hơi sung.',
  'insight.firstWeekPaceUp.cheeky.2':
    'Tuần đầu lấy {percent}%. Chia đều là {even}%. Chậm lại chút nha.',
  'insight.firstWeekPaceUp.roast.1':
    'Tuần đầu ăn {percent}% kỳ lương, chia đều là {even}%. Mấy tuần sau muốn nói chuyện.',
  'insight.firstWeekPaceUp.roast.2':
    '{percent}% trong một tuần, chia đều là {even}%. Chạy nước rút xong rồi, giờ đi bộ thôi.',
  'insight.firstWeekPaceUp.plain': 'Tuần đầu dùng {percent}% tiền của kỳ; chia đều là {even}%.',

  'insight.firstWeekPaceDown.soft.1':
    'Tuần đầu chỉ dùng {percent}% kỳ lương, chia đều là {even}%. Khởi đầu đẹp ghê.',
  'insight.firstWeekPaceDown.soft.2':
    'Tuần đầu nhẹ nhàng: dùng {percent}%, {compare} mức chia đều.',
  'insight.firstWeekPaceDown.cheeky.1':
    'Tuần đầu: chỉ {percent}%, dưới mức chia đều {even}%. Mượt.',
  'insight.firstWeekPaceDown.cheeky.2': 'Tuần đầu {percent}%. Chia đều là {even}%. Ghê chưa.',
  'insight.firstWeekPaceDown.roast.1':
    'Tuần đầu dùng {percent}%, dưới mức {even}%. Ngoan bất ngờ. Giữ nha.',
  'insight.firstWeekPaceDown.roast.2': '{percent}% tuần đầu, chia đều là {even}%. Mình hết ý kiến.',
  'insight.firstWeekPaceDown.plain': 'Tuần đầu dùng {percent}% tiền của kỳ; chia đều là {even}%.',

  'insight.paceSpare.soft.1': 'Cứ đà này, tới ngày lương ({payday}) còn dư khoảng {spare}.',
  'insight.paceSpare.soft.2': 'Giữ nhịp này thì tới {payday} còn khoảng {spare}.',
  'insight.paceSpare.cheeky.1': 'Dự kiến dư {spare} vào {payday}. Đừng tiêu trước trong đầu nha.',
  'insight.paceSpare.cheeky.2': 'Đà này thì tới {payday} dư {spare}. Đẹp.',
  'insight.paceSpare.roast.1':
    'Dư {spare} vào {payday} nếu giữ nhịp. Tiền chưa có thì đừng xài trước nha.',
  'insight.paceSpare.roast.2': 'Dự báo: {payday} còn {spare}. Giữ cho dự báo đúng nha.',
  'insight.paceSpare.plain': 'Theo nhịp chi tới giờ, ngày lương {payday} còn khoảng {spare}.',

  'insight.paceShort.soft.1':
    'Cứ đà này thì khoảng {runsOut} sẽ hơi căng, trước ngày lương {payday}. Vài ngày nhẹ tay là ổn.',
  'insight.paceShort.soft.2':
    'Nhắc nhẹ: theo nhịp này, khoảng {runsOut} là hụt. Còn thời gian, vài ngày nhỏ nhỏ là đủ.',
  'insight.paceShort.cheeky.1':
    'Lộ trình này hết xăng khoảng {runsOut}, lương thì {payday} mới về. Đổi đường không?',
  'insight.paceShort.cheeky.2':
    'Theo đà này, tiền cạn khoảng {runsOut}. Lương về {payday}. Mấy ngày tới nhẹ nhàng nha.',
  'insight.paceShort.roast.1':
    'Nhịp này cạn tiền khoảng {runsOut}, mà {payday} lương mới về. Vài ngày im ắng là kịp.',
  'insight.paceShort.roast.2':
    '{runsOut}: ngày hết tiền theo nhịp này. {payday}: ngày lương. Mình cùng thu hẹp khoảng cách nha.',
  'insight.paceShort.plain':
    'Theo nhịp chi tới giờ, tiền hết khoảng {runsOut}, trước ngày lương {payday}.',
};
