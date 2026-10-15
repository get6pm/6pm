import { foldWords, parseSpokenSpend } from '../capture/spoken-spend';
import { VND, type Currency } from '../money/currency';
import type { HowToTopic } from './ask-actions';
import type { AskQuery } from './ask-query';
import { POT_WORDS } from './read-query-guards';
import { has, words } from './read-query-words';

/** Asking 6pm to do something, or how something works, read with rules alone. */

/** "Log this spend": the words before the spend itself. */
const LOG = words(
  'vua',
  'ghi',
  'ghi giup',
  'ghi lai',
  'ghi giup minh',
  'log',
  'add',
  'nhap',
  'them khoan',
  'just spent',
  'just paid',
  'i paid',
  'i spent',
);
/** The words "Log" and its kin, said before the spend; left out of what the spend is called. */
const LOG_LEAD =
  /^(?:vừa|vua|ghi(?: giúp| giup| lại| lai)?(?: mình| minh)?|log|add|nhập|nhap|thêm khoản|them khoan|just spent|just paid|i paid|i spent)\s+/iu;
/** "Make a pot". */
const MAKE_POT = words(
  'tao hu',
  'tao quy',
  'tao heo',
  'mo hu',
  'lap hu',
  'them hu',
  'make a pot',
  'new pot',
  'create a pot',
  'start a pot',
);
/** The pot's name stops at its price or its date. */
const POT_NAME_STOP = /\s+(?:\d|by\b|before\b|trước|truoc|đến|den|tới|toi|vào|vao|for\s+\d)/iu;
const POT_LEAD =
  /^.*?(?:tạo hũ|tao hu|tạo quỹ|tao quy|tạo heo|tao heo|mở hũ|mo hu|lập hũ|lap hu|thêm hũ|them hu|make a pot|new pot|create a pot|start a pot)\s*(?:for\s+|cho\s+|để\s+|de\s+)?(?:a\s+|an\s+|the\s+)?/iu;

/** 6pm has no limit per category: a budget question is about how the daily number works. */
const BUDGET = words('ngan sach', 'budget', 'han muc', 'spending limit', 'dat gioi han');
const HOW = words(
  'lam sao',
  'how do i',
  'how to',
  'how can i',
  'cach',
  'what are the ways',
  'nhung cach',
  'may cach',
  'ways to',
);
const WAYS: readonly (readonly [HowToTopic, readonly string[]])[] = [
  ['email', words('email', 'mail', 'gmail', 'outlook')],
  ['share', words('share', 'chia se', 'receipt', 'bien lai', 'hoa don dien tu', 'photo', 'hinh')],
  // "Quẹt" (swipe a card) folds like "quét" (scan): Apple Pay is checked first.
  ['wallet', words('apple pay', 'wallet', 'the ngan hang')],
  ['scan', words('scan', 'qr', 'quet', 'vietqr')],
  ['widgets', words('widget', 'widgets', 'control center', 'lock screen', 'action button')],
  ['quickAdd', words('nhap tay', 'go tay', 'by hand', 'type', 'voice', 'giong noi')],
];
const ADD_SPEND = words(
  'add spend',
  'add a spend',
  'add spends',
  'them chi tieu',
  'ghi chi tieu',
  'nhap chi tieu',
  'log spend',
  'ways to add',
  'cach them',
);
const WHAT_IS = words('la gi', 'what s a', 'what is a', 'what is the', 'what s the');
const DAILY = words('con so moi ngay', 'so moi ngay', 'daily number', 'con so hom nay');
const WORKS_OUT = words('tinh sao', 'tinh the nao', 'calculated', 'work out', 'works', 'tinh');
const NEGATIVE = words('so am', 'negative', 'bi am');
const CLOSE = words('chot ngay', 'close the day', 'closing the day', 'khong chot', 'don t close');

/** How 6pm works, or how to catch spending one way. */
function howToIn(f: string): HowToTopic | undefined {
  if (has(f, BUDGET)) return 'budget';
  if (has(f, NEGATIVE)) return 'negative';
  if (has(f, DAILY) && (has(f, WORKS_OUT) || has(f, HOW))) return 'dailyNumber';
  if (has(f, CLOSE) && (has(f, HOW) || has(f, words('what happens', 'neu', 'sao')))) {
    return 'close';
  }
  if (has(f, WHAT_IS) && has(f, POT_WORDS)) return 'pot';
  if (!has(f, HOW) && !has(f, ADD_SPEND)) return undefined;
  const way = WAYS.find(([, list]) => has(f, list));
  if (way !== undefined) return way[0];
  return has(f, ADD_SPEND) ? 'ways' : undefined;
}

/**
 * An action or a how-to: log a spend ("vừa ăn phở 50k"), make a pot ("tạo hũ du lịch 10tr"),
 * or how something works. Nothing is saved here: the phone asks before it writes anything.
 */
export function actionIn(
  question: string,
  f: string,
  amount: number | null,
  categories: readonly string[],
  currency: Currency = VND,
): AskQuery | undefined {
  const how = howToIn(f);
  if (how !== undefined) return { kind: 'howTo', topic: how };
  if (has(f, MAKE_POT)) {
    const name = question.replace(POT_LEAD, '').split(POT_NAME_STOP)[0]?.trim() ?? '';
    if (name === '' || foldWords(name).trim() === '') return undefined;
    const pot = name.charAt(0).toLocaleUpperCase() + name.slice(1);
    return {
      kind: 'makePot',
      name: pot.slice(0, 60),
      ...(amount === null ? {} : { goal: amount }),
    };
  }
  if (has(f, LOG) && amount !== null) {
    const said = parseSpokenSpend(question.replace(LOG_LEAD, ''), currency);
    const category = categories.find((c) => f.includes(foldWords(c)));
    return {
      kind: 'logSpend',
      amount,
      name: (said.name === '' ? question : said.name).slice(0, 60),
      ...(category === undefined ? {} : { category }),
    };
  }
  return undefined;
}
