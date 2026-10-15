import { foldWords } from '../capture/spoken-spend';
import { has, words } from './read-query-words';

/**
 * Asking about their own records: what they spent, earned, owe or have left, their payday, their
 * trends, a what-if on their month, or why the app shows something. A model on the phone never
 * sees the records, so it may only explain general money questions; these keep the card that
 * says the phone cannot look them up yet.
 */
const RECORDS = words(
  // English
  'how much did i',
  'how much have i',
  'how much do i spend',
  'how much do i pay',
  'how much do i have',
  'how much do i owe',
  'how much do i earn',
  'how much do i make',
  'how much goes to',
  'how much is left',
  'did i',
  'do i spend',
  'do i pay',
  'do i owe',
  'am i over',
  'am i under',
  'am i on track',
  'am i paying',
  'am i spending',
  'am i going to make it',
  'i spend',
  'i spent',
  'i earn',
  'i earned',
  'my spending',
  'my spend',
  'my income',
  'my salary',
  'my balance',
  'my bills',
  'my subscriptions',
  'where did my money',
  'where does my money',
  'when s payday',
  'when is payday',
  'whens payday',
  'next payday',
  'until payday',
  'until i get paid',
  'why does it say',
  'why is my',
  'why was this',
  'why did i',
  'why am i',
  'what if i',
  // Vietnamese, where the asker is often left unsaid: any spending, being over, payday.
  'tieu',
  'vuot',
  'chi bao nhieu',
  'het bao nhieu',
  'con bao nhieu',
  'cong lai bao nhieu',
  'minh con',
  'minh dang',
  'minh no',
  'toi no',
  'dang no',
  'minh tra',
  'cat khoan nao',
  'co luong',
  'luong ve',
  've chua',
  'khi nao nhan luong',
  'bao gio nhan luong',
  'thu nhap cua minh',
  'minh kiem',
  'sao minh',
  'sao tong',
  'neu minh',
  'neu toi',
);

/** Whether a question is about the asker's own records rather than money in general. */
export function asksTheirRecords(question: string): boolean {
  return has(foldWords(question), RECORDS);
}
