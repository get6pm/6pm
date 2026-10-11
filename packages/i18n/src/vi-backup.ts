import type { Entry } from './catalogue-types';
import type { enBackup } from './en-backup';

export const viBackup: { readonly [Key in keyof typeof enBackup]: Entry } = {
  'backup.title': 'Sao lưu',
  'backup.row.off': 'Tắt',
  'backup.row.on': 'iCloud, {when}',
  'backup.row.found': 'Có bản sao lưu',
  'backup.row.deleting': 'Đang xóa…',
  'backup.ago.now': 'vừa xong',
  'backup.ago.minutes': { other: '{count} phút trước' },
  'backup.ago.hours': { other: '{count} giờ trước' },
  'backup.ago.days': { other: '{count} ngày trước' },

  'backup.status.on': 'Đã sao lưu {when}.',
  'backup.status.sub': {
    other: 'iCloud · {count} mục · đã mã hóa. 6pm vẫn chạy tốt khi không có nó.',
  },
  'backup.status.never': 'Sẵn sàng khi bạn muốn.',
  'backup.status.neverSub': 'iCloud · đã mã hóa. 6pm vẫn chạy tốt khi không có nó.',
  'backup.off.title': 'Giữ mọi ngày, mãi mãi.',
  'backup.off.sub':
    'Được niêm phong ngay trên iPhone trước khi gửi đi. Khóa nằm trong Chuỗi khóa iCloud của bạn, nên chúng tôi không đọc được gì.',
  'backup.tooLarge': 'Bản sao lưu gần nhất quá lớn nên chưa gửi được. Mọi thứ vẫn nằm trên iPhone.',
  'backup.note':
    'Sao lưu mỗi ngày một lần, sau khi bạn chốt ngày. Để khôi phục trên iPhone mới, hãy bật Chuỗi khóa iCloud trong Cài đặt iOS.',
  'backup.paused':
    'Sao lưu tạm dừng khi không có Max. Bản sao lưu gần nhất vẫn an toàn trong iCloud.',
  'backup.empty': 'Chưa có gì để sao lưu. Chốt ngày đầu tiên rồi quay lại nhé.',

  'backup.turnOn': 'Bật sao lưu',
  'backup.now': 'Sao lưu ngay',
  'backup.working': 'Đang sao lưu…',
  'backup.delete': 'Xóa bản sao lưu',
  'backup.deleteConfirm': 'Chạm lần nữa để xóa bản sao lưu',
  'backup.deleting': 'Đang xóa…',
  'backup.deletePending':
    'Bản sao lưu sẽ được xóa ngay khi 6pm có mạng. Trong lúc đó sẽ không gửi thêm gì.',

  'backup.found.title': 'iCloud của bạn đã có một bản sao lưu.',
  'backup.found.sub':
    'Nó đến từ một iPhone khác hoặc lần cài trước. Sao lưu từ máy này sẽ thay thế nó.',
  'backup.found.restore': 'Khôi phục về máy này',
  'backup.found.restoreConfirm': 'Chạm lần nữa để thay các ngày trên iPhone này',
  'backup.found.replace': 'Thay bằng iPhone này',

  'backup.restore.link': 'Khôi phục từ bản sao lưu',
  'backup.restore.title': 'Khôi phục từ bản sao lưu',
  'backup.restore.found': 'Tìm thấy bản sao lưu ngày {date}.',
  'backup.restore.sub': { other: '{count} mục · đã mã hóa trong iCloud.' },
  'backup.restore.do': 'Khôi phục các ngày của tôi',
  'backup.restore.working': 'Đang khôi phục…',
  'backup.restore.fresh': 'Bắt đầu mới',
  'backup.restore.freshNote':
    'Bắt đầu mới vẫn giữ bản sao lưu cho đến khi bản đầu tiên bạn tạo sau này thay thế nó.',
  'backup.restore.looking': 'Đang tìm bản sao lưu của bạn…',
  'backup.restore.none': 'Không tìm thấy bản sao lưu cho Chuỗi khóa iCloud này.',
  'backup.restore.unsupported':
    'Bản sao lưu này do phiên bản 6pm mới hơn tạo ra. Hãy cập nhật ứng dụng để khôi phục.',
  'backup.restore.wrongKey': 'Khóa trên iPhone này không mở được bản sao lưu.',
  'backup.restore.damaged': 'Bản sao lưu bị hỏng nên không thể khôi phục.',

  'backup.error.network': 'Không kết nối được 6pm. Thử lại sau giây lát nhé.',
  'backup.error.keychain':
    'Chuỗi khóa iCloud không lưu được khóa nên chưa sao lưu gì. Kiểm tra xem nó đã bật trong Cài đặt iOS chưa.',
  'backup.error.tooLarge': 'Bản sao lưu quá lớn để gửi. Mọi thứ vẫn nằm trên iPhone.',
  'backup.retry': 'Thử lại',
  'backup.error.generic': 'Chưa được. Thử lại nhé.',

  'backup.toast.deleted': 'Đã xóa bản sao lưu.',
  'companion.backupDone.soft': 'Sao lưu xong rồi. Các ngày của bạn an toàn.',
  'companion.backupDone.cheeky': 'Sao lưu xong. Thứ Ba tệ nhất của bạn cũng an toàn rồi.',
  'companion.backupDone.roast': 'Sao lưu xong. Mấy lần lỡ tay của bạn nằm trên mây mãi mãi.',
  'companion.backupDone.plain': 'Sao lưu hoàn tất.',
  'companion.backupRestored.soft': 'Chào mừng bạn về. Mọi thứ đều ở đây.',
  'companion.backupRestored.cheeky': 'Từ đám mây về rồi. Không thiếu gì cả.',
  'companion.backupRestored.roast': 'Khôi phục rồi. Lần sau đừng làm mất điện thoại nữa nhé.',
  'companion.backupRestored.plain': 'Đã khôi phục bản sao lưu.',
};
