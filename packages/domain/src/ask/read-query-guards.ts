import { words } from './read-query-words';

/** Words that keep the rules from answering a question they would read wrong. */

/** "How much": the ways it is typed. */
export const HOW_MUCH = words('how much', 'bao nhieu', 'bao nhiu', 'bn', 'bnhiu');
/** Asking to do something: log a spend, make a pot, set a budget. Not answered by Ask yet. */
export const ACTION = words(
  'vua',
  'ghi',
  'ghi giup',
  'tao',
  'dat ngan sach',
  'ngan sach',
  'log',
  'add',
  'make a',
  'set a budget',
  'nhap',
);
/** Questions with nothing designed to answer them yet: better "I don't know" than a guess. */
export const NOT_YET = words(
  'average',
  'trung binh',
  'tra gop',
  'instalment',
  'installment',
  'bnpl',
  'credit card',
  'the tin dung',
  'lai suat',
  'bao nhieu lai',
  'interest',
  'lai kep',
  'compound',
  'inflation',
  'lam phat',
  'difference between',
  'khac gi',
  'tips',
  'lam sao',
  'how do i',
  'how can i',
  'cut back',
  'nen cat',
  'subscription',
  'subscriptions',
  'dang ky',
  'tra phi',
  'payday',
  'get paid',
  'earn',
  'co luong',
  've chua',
  'toi luong',
  'thu nhap',
  'so am',
  'negative',
  'sai vay',
  'bi sai',
  'wrong',
  'la gi',
  'what s a',
  'what is a',
  'rule',
  'tinh sao',
  'tinh the nao',
  'calculated',
  'why does it say',
  'tang hay giam',
  'going up',
  'ngay nao',
  'day of the week',
  'late at night',
  'ngay thuong',
  'vuot',
  'over on',
  'nen de danh bao nhieu',
  'nen co bao nhieu',
  'chuan bi bao nhieu',
);
/** A pot question needs one of these besides the pot: full, when, enough. */
export const FULLNESS = words(
  'full',
  'covered',
  'day',
  'du',
  'when',
  'khi nao',
  'bao gio',
  'bao lau',
  'how long',
  'can de danh',
  'de danh bao nhieu',
);
/** Words for a pot when none is named. */
export const POT_WORDS = words('pot', 'hu', 'quy', 'heo', 'heo dat');
/** "What if": a question about a change, answered only for buying or saving more. */
export const WHAT_IF = words('what if', 'if i', 'neu', 'gia su', 'what happens');
/** "More": with a saving word, a question about saving more. */
export const MORE = words('more', 'them', 'extra', 'nhieu hon');
/** Saving words. */
export const SAVE = words('save', 'saved', 'saving', 'future you', 'tiet kiem', 'de danh');
/** "Save for…": a goal, even without "when". */
export const SAVE_FOR = words('save for', 'save up for', 'saving for');
/** The weekend ahead. */
export const WEEKEND = words('weekend', 'cuoi tuan', 'saturday and sunday', 'thu bay va chu nhat');
/** "Can I still spend", about today or tomorrow's line. */
export const CAN_SPEND = words(
  'tieu duoc',
  'xai duoc',
  'can i spend',
  'can spend',
  'left to spend',
);
/** A weekend already gone, which the weekend answer (the days ahead) does not cover. */
export const PAST_WEEKEND = words('cuoi tuan roi', 'cuoi tuan truoc', 'last weekend');
/** Month names, which the rules cannot place in a year: left to the model. */
export const MONTH_NAMES = words(
  'january',
  'february',
  'march',
  'april',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
);
/** Buying words that make a bare price a question about affording it. */
export const BUY = words('mua', 'buy', 'if i buy', 'di', 'order', 'dat');

/** "The biggest one": a list with the largest first. */
export const BIGGEST = words(
  'biggest purchase',
  'biggest spend',
  'biggest one',
  'nhieu nhat',
  'lon nhat',
  'dat nhat',
  'most expensive',
  'which was the biggest',
);
