import { wordMoods, type WordResponse } from '../contracts/word';
import { VND, type Currency } from '../money/currency';
import { askQuerySchema, type AskQuery } from './ask-query';
import { moneyIn } from './read-query-parts';

/**
 * What a model running on the phone needs beyond the server's prompts, and the checks its
 * answers pass. A small model gets examples instead of an enforced schema, and three things are
 * never its call: an amount (the phone parses it), distress or venting (the rules decide), and
 * the language it answers in.
 */

/** Examples after the reading rules, phrased unlike any real question so none leaks an answer. */
export const LOCAL_READ_TAIL = `

Reply with only a JSON object {"query": {...}}. No other text. Spans are objects: {"preset": "thisWeek"} or {"from": "YYYY-MM-DD", "to": "YYYY-MM-DD"}. Leave out fields that do not apply. Examples:
tuần này trà sữa hết bao nhiêu -> {"query":{"kind":"spend","range":{"preset":"thisWeek"},"category":"Trà sữa"}}
spent at Circle K yesterday? -> {"query":{"kind":"spend","range":{"preset":"yesterday"},"merchant":"Circle K"}}
đi lại tháng này so với tháng trước -> {"query":{"kind":"compare","range":{"preset":"thisMonth"},"against":{"preset":"lastMonth"},"category":"Đi lại"}}
tiền tuần trước đi đâu hết -> {"query":{"kind":"breakdown","range":{"preset":"lastWeek"}}}
list my Grab rides this month -> {"query":{"kind":"list","range":{"preset":"thisMonth"},"merchant":"Grab"}}
khoản nào lớn nhất tuần này -> {"query":{"kind":"list","range":{"preset":"thisWeek"},"sort":"amount"}}
mua tai nghe 1tr2 được không -> {"query":{"kind":"afford","amount":1200000}}
weekend budget? -> {"query":{"kind":"weekend"}}
bao giờ hũ Tết đầy -> {"query":{"kind":"potFull","pot":"Tết"}}
còn tiêu được bao nhiêu hôm nay -> {"query":{"kind":"today"}}
any bills due before payday? -> {"query":{"kind":"bills"}}
how's it going with my money -> {"query":{"kind":"howAmIDoing"}}
bao lâu nữa mua được xe 500tr -> {"query":{"kind":"goal","what":"xe","amount":500000000}}
vừa uống trà sữa 45k -> {"query":{"kind":"logSpend","amount":45000,"name":"Trà sữa"}}
how do I scan to pay? -> {"query":{"kind":"howTo","topic":"scan"}}
chào bạn -> {"query":{"kind":"chat","topic":"greeting"}}
what is a mortgage -> {"query":{"kind":"unknown"}}`;

/** Examples after the wording rules: the values stay placeholders. */
export const LOCAL_WORD_TAIL = `

Reply with only a JSON object {"text": "...", "mood": "..."} where mood is one of calm, happy, wave, nod, think, sleepy, plain. No other text. Never write a digit: write each value as its {placeholder}. Examples:
Fact (closeStreak) {days}=6, cheeky, en -> {"text":"{days} days closed in a row. Look at you, all organised.","mood":"happy"}
Fact (biggestSpend) {merchant}=Lotte {amount}=1,2tr {category}=Mua sắm, soft, vi -> {"text":"Khoản lớn nhất tuần này là {merchant}, {amount} cho {category}. Vẫn trong kế hoạch nha.","mood":"calm"}`;

/** A money question nothing on the phone can look up, answered plainly by the local model. */
export const EXPLAIN_SYSTEM =
  'You are the companion inside 6pm, a daily money app, talking to one person about money. Reply in the language of their question, English or Vietnamese. Answer in at most three short sentences, warm and plain. Explain money ideas simply and correctly. Never recommend a specific stock, coin, fund, bank, gold timing or loan: say that needs a licensed adviser. You cannot see their spending here; never make up their numbers. In Vietnamese, say "mình" for yourself and "bạn" for them.';

const AMOUNT_FIELDS = ['amount', 'minAmount', 'goal'] as const;

/** The first `{...}` in a model's reply, parsed, or null. */
function jsonIn(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * A local model's reading, made safe: a query the phone can answer, its amounts replaced by the
 * phone's own parse of the question (a reading that needs an amount the phone cannot find is
 * dropped), and never distress or venting, which only the rules may decide.
 */
export function safeLocalQuery(
  question: string,
  reply: string,
  currency: Currency = VND,
): AskQuery {
  const raw = jsonIn(reply);
  const body = raw !== null && typeof raw === 'object' && 'query' in raw ? raw.query : raw;
  const parsed = askQuerySchema.safeParse(body);
  if (!parsed.success) return { kind: 'unknown' };
  const query = parsed.data;
  if (query.kind === 'chat' && (query.topic === 'distress' || query.topic === 'venting')) {
    return { kind: 'unknown' };
  }
  const fields = query as Record<string, unknown>;
  if (!AMOUNT_FIELDS.some((key) => typeof fields[key] === 'number')) return query;
  const amount = moneyIn(question, currency);
  if (amount === null) return { kind: 'unknown' };
  const fixed = { ...fields };
  for (const key of AMOUNT_FIELDS) if (typeof fixed[key] === 'number') fixed[key] = amount;
  const checked = askQuerySchema.safeParse(fixed);
  return checked.success ? checked.data : { kind: 'unknown' };
}

const MOODS: ReadonlySet<string> = new Set(wordMoods);

/**
 * A local model's line: its JSON, or the reply itself when it wrote only the line. Values it wrote
 * out are put back as their placeholders, longest first, so the line check sees what the server's
 * model would have written; any other number still fails that check.
 */
export function localLine(
  reply: string,
  values: Readonly<Record<string, string>>,
): WordResponse | null {
  const raw = jsonIn(reply) as { text?: unknown; mood?: unknown } | null;
  const text =
    raw !== null && typeof raw.text === 'string'
      ? raw.text
      : reply.includes('{"')
        ? null
        : reply.trim();
  if (text === null || text === '') return null;
  const swapped = Object.entries(values)
    .filter(([, value]) => value.trim() !== '')
    .sort((a, b) => b[1].length - a[1].length)
    .reduce((line, [name, value]) => line.split(value).join(`{${name}}`), text);
  const mood =
    raw !== null && typeof raw.mood === 'string' && MOODS.has(raw.mood) ? raw.mood : 'calm';
  return { text: swapped.trim(), mood: mood as WordResponse['mood'] };
}

const VIETNAMESE_LETTER = /[ăâđêôơưạảãằắẳẵặầấẩẫậẻẽẹềếểễệỉĩịỏõọồốổỗộờớởỡợủũụừứửữựỳỷỹỵ]/iu;

/** An explanation in the language asked, not empty, and short enough for one answer card. */
export function explanationFits(text: string, language: 'en' | 'vi'): boolean {
  const answer = text.trim();
  if (answer.length < 12 || answer.length > 600) return false;
  return VIETNAMESE_LETTER.test(answer) === (language === 'vi');
}
