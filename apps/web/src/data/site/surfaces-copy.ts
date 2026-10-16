import type { SiteLang } from './copy';

/** The section on the places 6pm shows up before six: Lock Screen, island, widgets, Siri, buttons. */
export interface SurfacesCopy {
  readonly mark: string;
  readonly title: string;
  readonly sub: string;
  readonly lock: {
    readonly label: string;
    readonly date: string;
    readonly left: string;
    readonly widgetTop: string;
    readonly widgetBottom: string;
    readonly activityTop: string;
    readonly activityMain: string;
    readonly activityButton: string;
    readonly notice: string;
    readonly confirm: string;
    readonly edit: string;
  };
  /** Safe to spend today, short, as the small surfaces print it. */
  readonly safe: string;
  readonly island: {
    readonly label: string;
    readonly countdown: string;
    readonly top: string;
    readonly main: string;
    readonly paid: string;
    readonly note: string;
  };
  readonly widgets: {
    readonly label: string;
    readonly closesIn: string;
    readonly caught: string;
    readonly safeToday: string;
    readonly note: string;
  };
  readonly siri: {
    readonly said: string;
    readonly logged: string;
    readonly after: string;
    readonly amount: string;
  };
  readonly action: {
    readonly label: string;
    readonly icon: string;
    readonly first: string;
    readonly second: string;
    readonly buttonLabel: string;
    readonly buttonMain: string;
    readonly note: string;
  };
}

export const surfacesCopy: Readonly<Record<SiteLang, SurfacesCopy>> = {
  en: {
    mark: 'Before six',
    title: 'It lives where you already look.',
    sub: 'Lock Screen, Dynamic Island, widgets, Siri and the Action button. Most days you won’t open the app until six.',
    lock: {
      label: 'LOCK SCREEN · LIVE ACTIVITY',
      date: 'Friday 9 October',
      left: 'left',
      widgetTop: '6pm · Safe today',
      widgetBottom: '2 to check',
      activityTop: 'Day closes in 8 min',
      activityMain: '4 caught · 1 min',
      activityButton: 'Close',
      notice: 'Caught $4.50 · Oat latte',
      confirm: 'Confirm',
      edit: 'Edit',
    },
    safe: '$31',
    island: {
      label: 'DYNAMIC ISLAND',
      countdown: '8m',
      top: 'Waiting · tap when paid',
      main: '$12.00 to Noodle bar',
      paid: 'Paid',
      note: 'Paid by QR or cash? It waits up top until you say it’s done.',
    },
    widgets: {
      label: 'WIDGETS',
      closesIn: 'Day closes in',
      caught: '4 caught so far',
      safeToday: 'safe today',
      note: 'Your number on the Home Screen, in whichever look you picked.',
    },
    siri: {
      said: '“Log twelve dollars lunch in 6pm”',
      logged: 'Logged. Lunch · Food',
      after: 'Safe today is now $19',
      amount: '$12',
    },
    action: {
      label: 'ACTION BUTTON · CONTROL CENTER',
      icon: 'mic',
      first: 'Say it',
      second: 'Quick add',
      buttonLabel: 'Action button',
      buttonMain: 'Log a spend in 6pm',
      note: 'One press from anywhere, without unlocking.',
    },
  },
  vi: {
    mark: 'Trước sáu giờ',
    title: 'Nó ở ngay chỗ bạn hay nhìn.',
    sub: 'Màn hình khoá, Dynamic Island, widget, Siri và nút Tác vụ. Hầu hết các ngày, bạn chẳng cần mở app đến tận sáu giờ.',
    lock: {
      label: 'MÀN HÌNH KHOÁ · LIVE ACTIVITY',
      date: 'Thứ Sáu, 9 tháng 10',
      left: 'còn',
      widgetTop: '6pm · Hôm nay',
      widgetBottom: '2 chờ kiểm',
      activityTop: 'Chốt trong 8 phút',
      activityMain: '4 khoản · 1 phút',
      activityButton: 'Chốt',
      notice: 'Đã ghi 29.000₫ · Cà phê sữa đá',
      confirm: 'Xác nhận',
      edit: 'Sửa',
    },
    safe: '183k',
    island: {
      label: 'DYNAMIC ISLAND',
      countdown: '8 ph',
      top: 'Đang chờ · chạm khi đã trả',
      main: '45.000₫ cho Phở Hòa',
      paid: 'Đã trả',
      note: 'Trả bằng QR hay tiền mặt? Nó chờ ở trên cùng đến khi bạn xác nhận.',
    },
    widgets: {
      label: 'WIDGET',
      closesIn: 'Giờ chốt còn',
      caught: 'Đã ghi 4 khoản',
      safeToday: 'hôm nay còn',
      note: 'Con số của bạn ngay trên màn hình chính, theo giao diện bạn chọn.',
    },
    siri: {
      said: '“Ghi phở năm lăm nghìn vào 6pm”',
      logged: 'Đã ghi. Phở · Ăn uống',
      after: 'Hôm nay còn 128k',
      amount: '55k',
    },
    action: {
      label: 'NÚT TÁC VỤ · TRUNG TÂM ĐIỀU KHIỂN',
      icon: 'qr_code_scanner',
      first: 'Quét QR',
      second: 'Ghi nhanh',
      buttonLabel: 'Nút Tác vụ',
      buttonMain: 'Quét QR trong 6pm',
      note: 'Một lần bấm từ bất cứ đâu, không cần mở khoá.',
    },
  },
};
