import { describe, expect, it, jest } from '@jest/globals';

import type { AskQuery } from '@6pm/domain';

import type { ApiClient } from '../api/api-client';
import { ApiRequestError } from '../api/api-error';
import { readQuestion, type ReadingHelp } from './ask-reader';

function apiAnswering(result: () => Promise<unknown>) {
  const request = jest.fn(result);
  return { client: { request } as unknown as ApiClient, request };
}

const help: ReadingHelp = {
  today: '2026-10-09',
  categories: ['Ăn uống', 'Cà phê'],
  pots: ['Tết'],
  previous: null,
};

describe('reading a question', () => {
  it('takes the server’s query; it sees the question and the names, no amount', async () => {
    const query: AskQuery = { kind: 'spend', range: { preset: 'thisWeek' }, category: 'Cà phê' };
    const { client, request } = apiAnswering(() =>
      Promise.resolve({ intent: { kind: 'unknown' }, query }),
    );
    const reading = await readQuestion(client, 'tuần này cà phê hết bao nhiêu', help);
    expect(reading).toEqual({ query, offline: false });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/v1/ask',
        body: {
          question: 'tuần này cà phê hết bao nhiêu',
          today: '2026-10-09',
          categories: ['Ăn uống', 'Cà phê'],
          pots: ['Tết'],
        },
      }),
    );
  });

  it('sends the query before for a follow-up', async () => {
    const previous: AskQuery = { kind: 'breakdown', range: { preset: 'thisWeek' } };
    const { client, request } = apiAnswering(() => Promise.resolve({ intent: { kind: 'today' } }));
    await readQuestion(client, 'and last week?', { ...help, previous });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.objectContaining({ previous }) }),
    );
  });

  it('takes an intent from a server that only knows the original six', async () => {
    const { client } = apiAnswering(() => Promise.resolve({ intent: { kind: 'today' } }));
    expect(await readQuestion(client, 'How much today?', help)).toEqual({
      query: { kind: 'today' },
      offline: false,
    });
  });

  it('lets the rules read what a server that knows only the original six cannot', async () => {
    const { client } = apiAnswering(() => Promise.resolve({ intent: { kind: 'unknown' } }));
    expect(await readQuestion(client, 'How much did I spend this week?', help)).toEqual({
      query: { kind: 'spend', range: { preset: 'thisWeek' } },
      offline: false,
    });
  });

  it('reads with the phone’s rules when the server fails', async () => {
    const { client } = apiAnswering(() =>
      Promise.reject(new ApiRequestError('network', 'POST /v1/ask did not get an answer', true)),
    );
    expect(await readQuestion(client, 'Can I afford 2tr on Saturday?', help)).toEqual({
      query: { kind: 'afford', amount: 2_000_000 },
      offline: true,
    });
    expect(await readQuestion(client, 'how much on cà phê this week', help)).toEqual({
      query: { kind: 'spend', range: { preset: 'thisWeek' }, category: 'Cà phê' },
      offline: true,
    });
  });

  it('gives up on a server that is too slow, registration included', async () => {
    const { client } = apiAnswering(() => new Promise(() => undefined));
    const reading = await readQuestion(client, 'How much for the weekend?', help, 20);
    expect(reading).toEqual({ query: { kind: 'weekend' }, offline: true });
  });

  it('keeps a question the server would refuse for its length on the phone', async () => {
    const { client, request } = apiAnswering(() => Promise.resolve({ intent: { kind: 'today' } }));
    const reading = await readQuestion(client, `hôm nay ${'x'.repeat(400)}`, help);
    expect(request).not.toHaveBeenCalled();
    expect(reading).toEqual({ query: { kind: 'today' }, offline: true });
  });
});
