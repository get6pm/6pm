import { describe, expect, it } from 'vitest';

import { REPAYMENT } from '../capture/bill-payment';
import {
  billQuestion,
  closeReducer,
  startClose,
  stepPosition,
  type CloseEvent,
  type CloseState,
} from './close-flow';

const run = (state: CloseState, ...events: CloseEvent[]) => events.reduce(closeReducer, state);

const keepAll = (ids: readonly string[]): CloseEvent[] =>
  ids.map((id) => ({ type: 'decide', id, verdict: 'kept' }));

describe('the close asks about bill payments', () => {
  const cards = [
    { id: 'coffee' },
    { id: 'statement', askBill: 'card-bill', askWork: true },
    { id: 'payoff', askBill: REPAYMENT },
  ];

  it('asks each one after the cash step, in order, then goes on to the receipt', () => {
    let s = run(startClose(cards), ...keepAll(['coffee', 'statement', 'payoff']));
    s = run(s, { type: 'sortedShown' }, { type: 'cashDone' });
    expect(s.step).toBe('bill');
    expect(billQuestion(s)?.id).toBe('statement');
    expect(stepPosition(s.step).index).toBe(3);
    s = run(s, { type: 'answerBill', id: 'statement', paid: true });
    expect(s.step).toBe('bill');
    expect(billQuestion(s)?.id).toBe('payoff');
    s = run(s, { type: 'answerBill', id: 'payoff', paid: false });
    // The statement paid a bill: it is not spending, so it is never asked about as work.
    expect(s.step).toBe('receipt');
    expect(s.billAnswers).toEqual({ statement: true, payoff: false });
  });

  it('still asks the work question about a spend that was not a bill', () => {
    const s = run(
      startClose(cards),
      ...keepAll(['coffee', 'statement', 'payoff']),
      { type: 'sortedShown' },
      { type: 'cashDone' },
      { type: 'answerBill', id: 'statement', paid: false },
      { type: 'answerBill', id: 'payoff', paid: true },
    );
    expect(s.step).toBe('question');
  });

  it('never asks about a spend marked not mine, and takes no answer out of turn', () => {
    let s = run(
      startClose(cards),
      { type: 'decide', id: 'coffee', verdict: 'kept' },
      { type: 'decide', id: 'statement', verdict: 'notMine' },
      { type: 'decide', id: 'payoff', verdict: 'kept' },
      { type: 'sortedShown' },
      { type: 'cashDone' },
    );
    expect(billQuestion(s)?.id).toBe('payoff');
    expect(run(s, { type: 'answerBill', id: 'statement', paid: true })).toBe(s);
    s = run(s, { type: 'answerBill', id: 'payoff', paid: true });
    expect(s.step).toBe('receipt');
  });

  it('keeps its place when left and resumed', () => {
    const s = run(
      startClose(cards),
      ...keepAll(['coffee', 'statement', 'payoff']),
      { type: 'sortedShown' },
      { type: 'cashDone' },
      { type: 'answerBill', id: 'statement', paid: true },
      { type: 'pause' },
      { type: 'resume' },
    );
    expect(s.step).toBe('bill');
    expect(billQuestion(s)?.id).toBe('payoff');
  });

  it('goes straight to the receipt when nothing looks like a bill', () => {
    const s = run(startClose([{ id: 'coffee' }]), ...keepAll(['coffee']), { type: 'sortedShown' });
    expect(run(s, { type: 'cashDone' }).step).toBe('receipt');
  });
});
