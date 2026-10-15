/**
 * Scores the server's question reader on the Ask evaluation set, the same way the rules are
 * scored in the domain's tests. Each question is one model call on the account behind the API
 * (about 165 calls, a few cents with Haiku), counted against a fresh device's daily allowance.
 *
 *   pnpm exec tsx tools/scripts/ask-eval.ts [https://dev.at6pm.app]
 */
import { askQuerySchema, type AskQuery } from '../../packages/domain/src/ask/ask-query';
import { EVAL_CASES } from '../../packages/domain/src/ask/eval/ask-eval-cases';
import {
  EVAL_NAMES,
  EVAL_TODAY,
  languageOf,
  scoreReading,
  type EvalVerdict,
} from '../../packages/domain/src/ask/eval/ask-eval-score';

const host = process.argv[2] ?? 'https://dev.at6pm.app';
const api = `${host}/api/v1`;
/** One device answers this many questions a day; the set needs more than one. */
const PER_DEVICE = 55;

async function register(): Promise<string> {
  const response = await fetch(`${api}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'en' }),
  });
  const body = (await response.json()) as { token: string };
  return body.token;
}

async function read(token: string, question: string): Promise<AskQuery | string> {
  const names = EVAL_NAMES[languageOf(question)];
  const response = await fetch(`${api}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      question,
      today: EVAL_TODAY,
      categories: names.categories,
      pots: names.pots,
    }),
  });
  if (!response.ok) return `HTTP ${String(response.status)}`;
  const body = (await response.json()) as { query?: unknown };
  const parsed = askQuerySchema.safeParse(body.query);
  return parsed.success ? parsed.data : 'no query';
}

async function main(): Promise<void> {
  const tally: Record<EvalVerdict | 'failed', number> = {
    right: 0,
    wrong: 0,
    unknown: 0,
    failed: 0,
  };
  let token = await register();
  for (const [i, c] of EVAL_CASES.entries()) {
    if (i > 0 && i % PER_DEVICE === 0) token = await register();
    const got = await read(token, c.question);
    if (typeof got === 'string') {
      tally.failed += 1;
      console.log(`failed  ${c.group} ${c.question}  (${got})`);
      continue;
    }
    const verdict = scoreReading(got, c.want);
    tally[verdict] += 1;
    if (verdict !== 'right') {
      console.log(`${verdict.padEnd(7)} ${c.group} ${c.question}  →  ${JSON.stringify(got)}`);
    }
  }
  console.log(`\n${host}: ${String(EVAL_CASES.length)} questions`, tally);
}

await main();
