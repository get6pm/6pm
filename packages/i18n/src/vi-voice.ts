import type { Entry } from './catalogue-types';
import type { enVoice } from './en-voice';

export const viVoice: { readonly [Key in keyof typeof enVoice]: Entry } = {
  'voice.listening': 'Đang nghe',
  'voice.sayIt': 'Nói',
  'voice.nothingTap': 'Mình chưa nghe rõ. Chạm và nói lại nhé.',
  'voice.noAmount': 'Chưa nghe số tiền. Nói thêm bao nhiêu, như “bốn lăm nghìn”.',
  'voice.unavailable': 'Giọng nói cần tính năng đọc chính tả {language} trên iPhone này',
  'voice.language.vi': 'tiếng Việt',
  'voice.language.en': 'tiếng Anh',
  'voice.denied': '6pm chưa được dùng micrô hoặc nhận dạng giọng nói.',
  'voice.openSettings': 'Mở Cài đặt',
  'voice.tapHint': 'Nói khoản tiền mặt',
  'voice.promptTap': 'Nói như đang nhắn cho bạn',
  'voice.reading': 'Đang hiểu ý bạn',
  'voice.gotIt': 'Hiểu rồi',
  'voice.doneTalking': 'Nói xong',
  'voice.cancel': 'Huỷ',
  'voice.heard': 'Đã nghe “{said}”',
  'voice.micHint': 'Nói khoản chi',
  'voice.stopHint': 'Dừng nghe',
};
