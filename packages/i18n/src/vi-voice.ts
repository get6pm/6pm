import type { Entry } from './catalogue-types';
import type { enVoice } from './en-voice';

export const viVoice: { readonly [Key in keyof typeof enVoice]: Entry } = {
  'voice.mode.keypad': 'Bàn phím',
  'voice.mode.voice': 'Giọng nói',
  'voice.prompt': 'Giữ và nói như đang nhắn cho bạn',
  'voice.hold': 'Giữ',
  'voice.listening': 'Đang nghe',
  'voice.sayIt': 'Nói',
  'voice.save': 'Lưu',
  'voice.nothing': 'Mình chưa nghe rõ. Giữ và nói lại nhé.',
  'voice.nothingTap': 'Mình chưa nghe rõ. Chạm và nói lại nhé.',
  'voice.noAmount': 'Chưa nghe số tiền. Nói thêm bao nhiêu, như “bốn lăm nghìn”.',
  'voice.unavailable': 'Giọng nói cần tính năng đọc chính tả {language} trên iPhone này',
  'voice.language.vi': 'tiếng Việt',
  'voice.language.en': 'tiếng Anh',
  'voice.denied': '6pm chưa được dùng micrô hoặc nhận dạng giọng nói.',
  'voice.openSettings': 'Mở Cài đặt',
  'voice.holdHint': 'Giữ để nói khoản chi',
  'voice.tapHint': 'Nói khoản tiền mặt',
};
