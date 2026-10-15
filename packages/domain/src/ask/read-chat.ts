import type { ChatTopic } from './chat-topics';
import { has, words } from './read-query-words';

/** Words that say what small talk is about, folded like every rules reading. */

const DISTRESS = words(
  'khong chiu noi nua',
  'het chiu noi roi',
  'cant take this anymore',
  'can t take this anymore',
  'muon chet',
  'tu tu',
  'kill myself',
  'end my life',
  'khong muon song',
  'want to die',
  'chan song',
  'khong thiet song',
);
const UNSAFE = words(
  'vay nong',
  'tin dung den',
  'danh de',
  'lo de',
  'so de',
  'ca do',
  'ca cuoc',
  'casino',
  'app vay',
  'vay online',
  'loan app',
  'payday loan',
  'hide spending',
  'giau vo',
  'giau chong',
  'hide from my wife',
  'hide from my husband',
);
const INVESTING = words(
  'co phieu',
  'chung khoan',
  'crypto',
  'coin',
  'bitcoin',
  'btc',
  'etf',
  'stock',
  'stocks',
  'forex',
  'mua vang',
  'buy gold',
  'dau tu',
  'invest',
  'pump',
);
const ROAST = words(
  'roast',
  'chui minh',
  'mang minh',
  'chui di',
  'mang di',
  'scold me',
  'judge me',
  'ca khia',
);
const HYPE = words(
  'hype me',
  'khen minh',
  'khen cai',
  'compliment me',
  'dong vien',
  'cheer me up',
  'motivate me',
);
const VENTING = words(
  'het tien',
  'broke',
  'stress',
  'stressed',
  'chan qua',
  'buon qua',
  'tieu hoang',
  'feel terrible',
  'feel bad about',
  'luc nao cung het',
  'nan qua',
);
const PRIVACY = words(
  'bank account',
  'tai khoan ngan hang',
  'do you see',
  'can you see',
  'who can see',
  'doc tin nhan',
  'my data',
  'du lieu cua minh',
  'ban co thay',
  'ban co xem',
);
const IDENTITY = words(
  'ban la ai',
  'who are you',
  'are you an ai',
  'are you a bot',
  'are you real',
  'nguoi that',
  'ban ten gi',
  'what are you',
  'your name',
);
const OFF_TOPIC = words(
  'troi mua',
  'weather',
  'thoi tiet',
  'essay',
  'homework',
  'bai tap',
  'write code',
  'viet code',
  'bong da',
  'football',
);
const GREETING = words(
  'hi',
  'hello',
  'hey',
  'chao',
  'xin chao',
  'good morning',
  'chao buoi sang',
  'alo',
);
const THANKS = words('thanks', 'thank you', 'thx', 'ty', 'cam on', 'ok', 'oke');

/** Topics read first, before any lookup: what they are about matters more than any number. */
export function urgentTopicIn(f: string, hasAmount: boolean): ChatTopic | undefined {
  if (has(f, DISTRESS)) return 'distress';
  if (has(f, UNSAFE)) return 'unsafe';
  if (has(f, INVESTING) && !hasAmount) return 'investing';
  return undefined;
}

/** Small talk: what it is about, or undefined when the question asks for a lookup. */
export function chatTopicIn(f: string, spoken: number): ChatTopic | undefined {
  if (has(f, ROAST)) return 'roast';
  if (has(f, HYPE)) return 'hype';
  if (has(f, VENTING)) return 'venting';
  if (has(f, PRIVACY)) return 'privacy';
  if (has(f, IDENTITY)) return 'identity';
  if (has(f, OFF_TOPIC)) return 'offTopic';
  if (spoken > 4) return undefined;
  if (has(f, THANKS)) return 'thanks';
  if (has(f, GREETING)) return 'greeting';
  return undefined;
}
