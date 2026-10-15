import type { SiteLang } from './copy';

/** The lines the page writes in the browser, where they depend on the visitor's clock or the list. */
export interface LiveLines {
  readonly clock: (time: string, left: string) => string;
  readonly closeNow: string;
  readonly duration: (hours: number, minutes: number) => string;
  readonly countdown: (days: number, hours: string, minutes: string) => string;
  readonly out: string;
  readonly sent: string;
  readonly notAnEmail: string;
  readonly busy: string;
  readonly unreachable: string;
}

export const liveLines: Readonly<Record<SiteLang, LiveLines>> = {
  en: {
    clock: (time, left) => `${time} where you are · next close in ${left}`,
    closeNow: 'It’s six. Time to close the day.',
    duration: (h, m) => (h ? `${h}h ${m}m` : `${m}m`),
    countdown: (d, h, m) => `${d}d ${h}h ${m}m to launch`,
    out: 'Out now',
    sent: 'You’re on the list. See you at six.',
    notAnEmail: 'That doesn’t look like an email yet.',
    busy: 'Too many tries from here. Give it a minute, then try again.',
    unreachable: 'Couldn’t reach the list. Check your connection and try again.',
  },
  vi: {
    clock: (time, left) => `Chỗ bạn đang là ${time} · còn ${left} đến giờ chốt`,
    closeNow: 'Sáu giờ rồi. Chốt ngày thôi.',
    duration: (h, m) => (h ? `${h} giờ ${m} phút` : `${m} phút`),
    countdown: (d, h, m) => `Còn ${d} ngày ${h} giờ ${m} phút`,
    out: 'Đã ra mắt',
    sent: 'Bạn đã có tên. Hẹn lúc sáu giờ.',
    notAnEmail: 'Email này có vẻ chưa đúng.',
    busy: 'Thử nhiều lần quá. Đợi một phút rồi thử lại nhé.',
    unreachable: 'Chưa kết nối được. Kiểm tra mạng rồi thử lại nhé.',
  },
};
