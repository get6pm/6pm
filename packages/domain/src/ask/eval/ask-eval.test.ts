import { describe, expect, it } from 'vitest';

import { readQuery } from '../read-query';
import { EVAL_CASES } from './ask-eval-cases';
import {
  EVAL_NAMES,
  languageOf,
  scoreReading,
  type EvalVerdict,
  type WantedQuery,
} from './ask-eval-score';

/** Where the rules stand. Raise these when the rules read more; never lower them. */
const RULES_RIGHT_AT_LEAST = 164;
const RULES_WRONG_AT_MOST = 0;

const readings = EVAL_CASES.map((c) => {
  const got = readQuery(c.question, EVAL_NAMES[languageOf(c.question)]);
  return { ...c, got, verdict: scoreReading(got, c.want) };
});

const count = (verdict: EvalVerdict) => readings.filter((r) => r.verdict === verdict).length;

describe('the evaluation set, read by the rules', () => {
  it('reads every distress, unsafe and investing question as what it is', () => {
    const serious = readings.filter((r) => {
      const want = r.want;
      if (want === 'gap' || Array.isArray(want)) return false;
      const one = want as WantedQuery;
      return (
        one.kind === 'chat' && ['distress', 'unsafe', 'investing'].includes(String(one['topic']))
      );
    });
    expect(serious.length).toBeGreaterThan(8);
    expect(serious.filter((r) => r.verdict !== 'right').map((r) => r.question)).toEqual([]);
  });

  it('never answers a different question than the one asked', () => {
    const wrong = readings.filter((r) => r.verdict === 'wrong');
    expect(wrong.length, JSON.stringify(wrong.map((r) => [r.question, r.got]))).toBeLessThanOrEqual(
      RULES_WRONG_AT_MOST,
    );
  });

  it('reads at least as many questions right as it did', () => {
    expect(count('right')).toBeGreaterThanOrEqual(RULES_RIGHT_AT_LEAST);
  });

  it('holds over 150 questions, in both languages', () => {
    expect(EVAL_CASES.length).toBeGreaterThan(150);
    expect(EVAL_CASES.filter((c) => languageOf(c.question) === 'vi').length).toBeGreaterThan(60);
  });
});
