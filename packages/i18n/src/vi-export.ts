import type { enExport } from './en-export';

/** Xuất dữ liệu: dòng trong Cài đặt, hàng tiêu đề của tệp CSV và các chữ trong tệp. */
export const viExport: { readonly [Key in keyof typeof enExport]: string } = {
  'export.title': 'Xuất dữ liệu',
  'export.row.value': 'CSV · Sheets',
  'export.empty': 'Chưa có gì để xuất. Thêm một khoản chi trước nhé.',
  'export.failed': 'Chưa tạo được tệp. Bạn thử lại nhé.',

  'export.csv.date': 'Ngày',
  'export.csv.time': 'Giờ',
  'export.csv.merchant': 'Nơi chi',
  'export.csv.category': 'Danh mục',
  'export.csv.amount': 'Số tiền (VND)',
  'export.csv.status': 'Trạng thái',
  'export.csv.source': 'Nguồn',
  'export.csv.wallet': 'Ví',
  'export.csv.note': 'Ghi chú',
  'export.csv.detail': 'Chi tiết',
  'export.csv.forWork': 'Cho công việc',
  'export.csv.foreignAmount': 'Số tiền ngoại tệ',
  'export.csv.currency': 'Tiền tệ',
  'export.csv.yes': 'Có',
  'export.csv.no': 'Không',
};
