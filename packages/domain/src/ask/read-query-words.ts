import type { AskRangePreset } from './ask-query';

/** The words the rules reader looks for, in English and Vietnamese, folded (see `readQuery`). */

/** Phrases as they read in folded text: lower case, no accents, padded with spaces. */
export const words = (...list: string[]) => list.map((w) => ` ${w} `);
export const has = (f: string, list: readonly string[]) => list.some((w) => f.includes(w));

/** Spans in the order they are tried: "last" before "this", so "last week" is not "this week". */
export const RANGE_WORDS: readonly (readonly [AskRangePreset, readonly string[]])[] = [
  ['yesterday', words('yesterday', 'hom qua')],
  ['today', words('today', 'hom nay')],
  ['lastWeek', words('last week', 'tuan truoc', 'tuan roi')],
  ['thisWeek', words('this week', 'tuan nay')],
  ['lastMonth', words('last month', 'thang truoc', 'thang roi')],
  ['thisMonth', words('this month', 'thang nay')],
  ['last7Days', words('last 7 days', 'past 7 days', '7 ngay qua', '7 ngay')],
  ['last30Days', words('last 30 days', 'past 30 days', '30 ngay qua', '30 ngay')],
  ['lastCycle', words('last cycle', 'last pay cycle', 'ky luong truoc')],
  [
    'thisCycle',
    words('this cycle', 'this pay cycle', 'ky luong nay', 'since payday', 'tu luc nhan luong'),
  ],
];

export const CHAT = words(
  'thanks',
  'thank you',
  'thx',
  'ty',
  'cam on',
  'hi',
  'hello',
  'hey',
  'chao',
  'xin chao',
  'ok',
  'oke',
);
export const CAN = words(
  'can i',
  'could i',
  'should i',
  'afford',
  'duoc khong',
  'duoc ko',
  'duoc bao nhieu',
  'con bao nhieu',
  'con lai',
  'nen',
);
export const BILLS = words('bill', 'bills', 'hoa don', 'tien dien', 'tien nuoc', 'den han', 'due');
export const HOW = words(
  'how am i doing',
  'how s my',
  'how is my',
  'how are my',
  'the nao roi',
  'on khong',
  'sao roi',
  'on ko',
  'tinh hinh',
);
export const COMPARE = words(
  'compare',
  'compared',
  'vs',
  'versus',
  'than last',
  'than the',
  'so voi',
  'so sanh',
  'more than',
  'less than',
  'nhieu hon',
  'it hon',
);
export const BREAKDOWN = words(
  'where did',
  'where does',
  'where s my money',
  'breakdown',
  'di dau',
  'vao dau',
  'vao gi',
  'on what',
  'gom nhung gi',
);
export const LIST = words(
  'show me',
  'show my',
  'may lan',
  'nhung lan',
  'khoan nao',
  'list',
  'what did i buy',
  'what have i bought',
  'liet ke',
  'mua gi',
  'xem lai',
  'nhung khoan',
  'cac khoan',
);
export const PAST = words(
  'did i spend',
  'have i spent',
  'i spent',
  'spent',
  'spend on',
  'da tieu',
  'da xai',
  'da chi',
  'tieu het',
  'xai het',
  'het bao nhieu',
  'tieu bao nhieu',
  'xai bao nhieu',
  'chi bao nhieu',
  'bao nhieu tien',
);
/** Words a merchant name never runs into: where it stops after "at" / "ở". */
export const STOP = new Set([
  'this',
  'last',
  'today',
  'yesterday',
  'the',
  'on',
  'in',
  'for',
  'tuan',
  'thang',
  'hom',
  'nay',
  'roi',
  'het',
  'bao',
  'nhieu',
  'khong',
  'ko',
  'chua',
  'vay',
  'a',
  'nhe',
]);

/** Words that make a question about a weak "how": checked last, as they also end other questions. */
export const HOW_LOOSE = words('the nao', 'dao nay', 'how am i', 'on chua');
/** "When can I…", "how long until…": a goal far off. */
export const GOAL_WHEN = words(
  'khi nao',
  'bao gio',
  'when can i',
  'when will i',
  'when could i',
  'how long',
  'how many years',
  'how many months',
  'bao lau',
  'may nam',
  'bao nhieu nam',
  'bao nhieu thang',
);
/** The verb before the thing a goal is for. */
export const GOAL_GET = words(
  'mua',
  'buy',
  'afford',
  'du tien',
  'save for',
  'save up for',
  'saving for',
  'de danh',
  'tiet kiem',
);
/** Words skipped between a goal's verb and its thing ("mua được nhà", "buy a house"). */
export const GOAL_FILLER = new Set([
  'duoc',
  'dc',
  'mot',
  'cai',
  'can',
  'chiec',
  'con',
  'a',
  'an',
  'the',
  'my',
  'our',
  'up',
  'for',
  'to',
  'mua',
]);
/** Pot-name words too general to say which pot is meant. */
export const POT_GENERIC = new Set([
  'mua',
  'quy',
  'hu',
  'tien',
  'tiet',
  'kiem',
  'cho',
  'de',
  'danh',
  'pot',
  'fund',
  'saving',
  'savings',
  'for',
  'the',
]);
/** "over 500k", "trên 1tr5": the smallest amount a list keeps. Read on the question as written. */
export const OVER =
  /(?:^|\s)(?:over|above|at least|more than|trên|tren|hơn|hon|từ|tu)\s+(\d[\d.,]*\s*\p{L}*\d{0,3})/u;
