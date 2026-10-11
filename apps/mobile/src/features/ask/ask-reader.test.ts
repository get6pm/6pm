import { describe, expect, it, jest } from '@jest/globals';

import type { AskIntent } from '@6pm/domain';

import type { ApiClient } from '../api/api-client';
import { ApiRequestError } from '../api/api-error';
import { readQuestion } from './ask-reader';

function apiAnswering(result: () => Promise<unknown>) {
  const request = jest.fn(result);
  return { client: { request } as unknown as ApiClient, request };
}

describe('reading a question', () => {
  it('takes the server’s reading, which sees only the question', async () => {
    const intent: AskIntent = { kind: 'afford', amount: 1_500_000 };
    const { client, request } = apiAnswering(() => Promise.resolve({ intent }));
    const reading = await readQuestion(client, 'mua giày 1tr5 được không', []);
    expect(reading).toEqual({ intent, offline: false });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/v1/ask',
        body: { question: 'mua giày 1tr5 được không' },
      }),
    );
  });

  it('reads with the phone’s rules when the server fails', async () => {
    const { client } = apiAnswering(() =>
      Promise.reject(new ApiRequestError('network', 'POST /v1/ask did not get an answer', true)),
    );
    expect(await readQuestion(client, 'Can I afford 2tr on Saturday?', [])).toEqual({
      intent: { kind: 'afford', amount: 2_000_000 },
      offline: true,
    });
    expect(await readQuestion(client, 'When is Tết full?', ['Tết'])).toEqual({
      intent: { kind: 'potFull', pot: 'Tết' },
      offline: true,
    });
  });

  it('gives up on a server that is too slow, registration included', async () => {
    const { client } = apiAnswering(() => new Promise(() => undefined));
    const reading = await readQuestion(client, 'How much for the weekend?', [], 20);
    expect(reading).toEqual({ intent: { kind: 'weekend' }, offline: true });
  });

  it('does not use an answer that is not an intent', async () => {
    const { client } = apiAnswering(() => Promise.reject(new Error('The answer did not match')));
    expect((await readQuestion(client, 'hello', [])).offline).toBe(true);
  });

  it('keeps a question the server would refuse for its length on the phone', async () => {
    const { client, request } = apiAnswering(() => Promise.resolve({ intent: { kind: 'today' } }));
    const reading = await readQuestion(client, `hôm nay ${'x'.repeat(400)}`, []);
    expect(request).not.toHaveBeenCalled();
    expect(reading).toEqual({ intent: { kind: 'today' }, offline: true });
  });
});
