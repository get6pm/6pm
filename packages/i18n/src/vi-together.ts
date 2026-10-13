import type { Entry } from './catalogue-types';
import type { enTogether } from './en-together';

export const viTogether: { readonly [Key in keyof typeof enTogether]: Entry } = {
  'together.title': 'Cùng chia ngân sách',
  'together.card.subOff': 'Cùng góp một hũ với ai đó.',
  'together.card.subOn': 'Mời ai đó cùng góp một hũ.',
  'together.card.subPaired': { other: 'Cùng {name} · {count} hũ chung' },
  'together.card.open': 'Mở Cùng chia ngân sách',
  'together.you': 'Bạn',
  'together.partner': 'Người cùng góp',

  'together.intro.title': 'Cùng nhau để dành.',
  'together.intro.sub':
    'Góp chung một hũ với người bạn cùng để dành. Cả hai cùng bỏ vào, và ai cũng thấy ai đã góp bao nhiêu. Những ngày của riêng bạn vẫn nằm trên điện thoại của bạn.',
  'together.intro.note':
    'Đăng nhập bằng Apple chỉ dùng cho Cùng chia ngân sách. 6pm chỉ hỏi tên, không bao giờ hỏi email.',
  'together.signIn.failed': 'Chưa đăng nhập được bằng Apple. Thử lại nhé.',
  'together.signIn.unavailable': 'iPhone này chưa dùng được Đăng nhập bằng Apple.',

  'together.waiting.title': 'Mới có mình bạn.',
  'together.waiting.sub':
    'Gửi đường link cho người bạn cùng để dành. Khi họ vào, họ sẽ thấy các hũ chung của hai bạn.',
  'together.paired.title': 'Bạn và {name}',
  'together.paired.sub': { other: '{count} hũ chung' },
  'together.invite': 'Mời ai đó',
  'together.invite.again': 'Gửi link mời mới',
  'together.invite.message': 'Cùng để dành với mình trên 6pm nhé: {url}',
  'together.invite.note': 'Mỗi link mời dùng được một lần, trong 7 ngày.',
  'together.offline': 'Đang ngoại tuyến. Đây là lần bạn xem gần nhất.',

  'together.pots.title': 'Hũ chung',
  'together.newPot': 'Hũ chung mới',
  'together.newPotSub': 'Cả hai cùng góp vào.',
  'together.jar.add': 'Bỏ {amount} vào {name}',
  'together.jar.split': 'Bạn {mine} · {partner} {theirs}',
  'together.jar.mine': 'Bạn đã góp {mine}',

  'together.pot.edit': 'Sửa hũ chung',
  'together.pot.start': 'Mở hũ chung',
  'together.pot.save': 'Lưu',
  'together.pot.sumMonthly': 'Khoảng {amount} mỗi tháng, cả hai cùng góp',
  'together.pot.sumSub': 'Tiền bạn góp được tính như khi bỏ thêm vào hũ của riêng bạn.',
  'together.pot.sumNone': 'Không hạn, không vội',
  'together.pot.sumNoneSub': 'Muốn bỏ vào lúc nào cũng được.',
  'together.pot.amount': 'Góp',
  'together.pot.addButton': 'Góp {amount}',
  'together.pot.entries': 'Ai đã góp bao nhiêu',
  'together.pot.empty': 'Chưa có gì trong hũ.',
  'together.pot.entry': '{who} góp · {day}',
  'together.pot.takeBack': 'Rút lại',
  'together.pot.takeBackLabel': 'Rút lại {amount}',
  'together.pot.delete': 'Xoá hũ chung',
  'together.pot.deleteConfirm': 'Chạm lần nữa để xoá hũ cho cả hai',
  'together.pot.deleted': 'Đã xoá {name}',
  'together.pot.gone': 'Hũ này không còn nữa. Có thể người kia đã xoá.',

  'together.leave': 'Rời Cùng chia ngân sách',
  'together.leaveConfirm': 'Chạm lần nữa để rời',
  'together.leave.note':
    'Rời đi sẽ kết thúc cho cả hai và xoá các hũ chung khỏi máy chủ của chúng tôi. Mỗi người vẫn giữ phần mình đã góp, trên điện thoại của mình.',
  'together.deleteAccount': 'Xoá tài khoản Cùng chia ngân sách',
  'together.deleteConfirm': 'Chạm lần nữa để xoá tài khoản',
  'together.delete.note':
    'Xoá đăng nhập của bạn và mọi thứ hai bạn chia sẻ, đồng thời báo Apple rằng 6pm không còn dùng Apple ID của bạn. Những ngày của riêng bạn vẫn nằm trên điện thoại này.',
  'together.kept.title': 'Giữ trên iPhone này',
  'together.kept.sub': 'Bạn đã góp vào các hũ chung: {amount}. Vẫn giữ ở đây khi hũ không còn.',

  'together.join.title': 'Tham gia Cùng chia ngân sách',
  'together.join.sub':
    'Có người mời bạn cùng góp hũ trên 6pm. Đăng nhập bằng Apple để tham gia. Những ngày của riêng bạn vẫn nằm trên điện thoại của bạn.',
  'together.join.button': 'Tham gia',
  'together.join.expired': 'Link mời này đã hết hạn. Xin một link mới nhé.',
  'together.join.used': 'Link mời này đã được dùng rồi. Xin một link mới nhé.',
  'together.join.full': 'Ở đó đã đủ hai người cùng góp.',
  'together.join.own': 'Đây là link mời của chính bạn. Gửi nó cho người bạn cùng để dành nhé.',
  'together.join.paired':
    'Bạn đang góp hũ chung rồi. Rời Cùng chia ngân sách trước, rồi mở lại link.',
  'together.join.missing': 'Link mời này không dùng được. Xin một link mới nhé.',

  'together.error.offline': 'Không kết nối được với 6pm. Chưa có gì thay đổi.',
  'together.error.failed': 'Chưa làm được. Chưa có gì thay đổi.',
  'together.ended': 'Cùng chia ngân sách đã kết thúc. Phần bạn đã góp vẫn nằm trên điện thoại này.',
  'together.left': 'Bạn đã rời Cùng chia ngân sách.',
  'together.deleted': 'Đã xoá tài khoản Cùng chia ngân sách.',
  'together.joined': 'Xong rồi. Bạn đang cùng chia ngân sách với {name}.',
};
