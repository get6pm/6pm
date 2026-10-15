import type { Entry } from './catalogue-types';
import type { enAskChat } from './en-ask-chat';

export const viAskChat: { readonly [Key in keyof typeof enAskChat]: Entry } = {
  'ask.chat.greeting.soft': 'Chào bạn! Muốn xem gì về tiền nong cứ hỏi mình nha.',
  'ask.chat.greeting.cheeky': 'Hé lô! Hỏi gì về tiền cũng được, số liệu mình nắm hết rồi.',
  'ask.chat.greeting.roast': 'Ồ, bạn đó hả. Tới hỏi xem tình hình tệ cỡ nào à?',
  'ask.chat.greeting.plain': 'Chào bạn. Bạn có thể hỏi về chi tiêu, hóa đơn hoặc các hũ.',
  'ask.chat.thanks.soft': 'Có gì đâu. Hôm nay nhớ chăm sóc bản thân nha.',
  'ask.chat.thanks.cheeky': 'Không có chi! Trả công mình bằng vài ngày chốt đúng giờ là được.',
  'ask.chat.thanks.roast': 'Khỏi cảm ơn mình. Cảm ơn cái ngân sách bạn suýt giữ được ấy.',
  'ask.chat.thanks.plain': 'Không có gì.',
  'ask.chat.offTopic.soft':
    'Cái này nằm ngoài chuyên môn của mình rồi. Còn chuyện tiền thì cứ hỏi nha.',
  'ask.chat.offTopic.cheeky': 'Ngoài phận sự của mình rồi. Hỏi mình tiền đi đâu hết đi 👀',
  'ask.chat.offTopic.roast': 'Mình là sổ chi tiêu chứ đâu phải Google. Hỏi chuyện tiền đi.',
  'ask.chat.offTopic.plain': 'Mình chỉ giúp được chuyện tiền bạc trong 6pm thôi.',
  'ask.chat.identity':
    'Mình là bạn đồng hành của bạn trong 6pm. Mọi con số mình đưa ra đều được tính ngay trên điện thoại, từ chính các khoản chi của bạn. Mình là chương trình, không phải người thật nha.',
  'ask.chat.privacy':
    'Mình không thấy tài khoản ngân hàng của bạn. Mình chỉ biết những gì có trong 6pm, và chúng nằm trên điện thoại của bạn. Để hiểu câu hỏi, máy chủ chỉ nhận câu hỏi cùng tên danh mục và tên hũ; để viết một câu, chỉ vài thông tin trong câu đó.',
  'ask.chat.venting.soft': 'Nghe mệt ghê. Bạn không phải gánh một mình đâu.',
  'ask.chat.venting.cheeky': 'Căng ha. Hít thở cái đã, chỉ là con số thôi, không phải bản án.',
  'ask.chat.venting.plain': 'Áp lực tiền bạc là có thật.',
  'ask.chat.goingRight': 'Có một điều đang ổn nè:',
  'ask.chat.freshStart': 'Ngày mai lại bắt đầu với một con số mới.',
  'ask.chat.roast.soft': 'Nhẹ nhàng thôi nha:',
  'ask.chat.roast.cheeky': 'Bạn tự xin đó nha.',
  'ask.chat.roast.roast': 'Chuẩn bị tinh thần đi.',
  'ask.chat.roast.plain': 'Khoản nổi bật nhất:',
  'ask.chat.roastNothing.soft': 'Chẳng có gì để chọc cả, bạn đang làm tốt lắm.',
  'ask.chat.roastNothing.cheeky': 'Mình soi rồi. Nói thật là chẳng có gì để roast. Hơi cụt hứng.',
  'ask.chat.roastNothing.roast': 'Định roast bạn mà chẳng có gì để roast. Bực ghê.',
  'ask.chat.roastNothing.plain': 'Hiện không có khoản nào nổi bật.',
  'ask.chat.hype.soft': 'Bạn xứng đáng nghe điều này:',
  'ask.chat.hype.cheeky': 'Bật chế độ khen:',
  'ask.chat.hype.roast': 'Thôi được, công nhận:',
  'ask.chat.hype.plain': 'Có điều đang ổn:',
  'ask.chat.hypeNothing.soft': 'Bạn đã mở app và kiểm tra, vậy là giỏi rồi.',
  'ask.chat.hypeNothing.cheeky': 'Tự nguyện mở app quản lý chi tiêu. Huyền thoại.',
  'ask.chat.hypeNothing.roast': 'Ít ra bạn còn ghé đây, hơn khối người. Tạm tự hào.',
  'ask.chat.hypeNothing.plain': 'Cứ tiếp tục, từng chút sẽ cộng dồn.',
  'ask.chat.distress':
    'Mình rất tiếc khi bạn đang thấy như vậy. Bạn không phải chịu một mình đâu: hãy nói chuyện với người bạn tin, hoặc gọi Đường dây nóng Ngày Mai 096 306 1414 (13h đến 20h30, thứ Tư đến Chủ nhật). Nếu bạn đang gặp nguy hiểm ngay lúc này, hãy gọi 115.',
  'ask.chat.investing':
    'Mình không thể khuyên nên đầu tư vào đâu hay lúc nào, việc đó cần chuyên gia có giấy phép. Mình có thể cho bạn xem mỗi tháng dư bao nhiêu, hoặc một hũ đang đầy nhanh cỡ nào.',
  'ask.chat.unsafe':
    'Cái này mình không giúp được. Nếu đang kẹt tiền, mình có thể cho bạn xem còn bao nhiêu tới ngày lương, hoặc các hũ đỡ được bao nhiêu. Nếu bị bên cho vay trái phép đe dọa, hãy gọi 113.',
};
