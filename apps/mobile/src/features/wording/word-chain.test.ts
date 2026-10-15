import { describe, expect, it, jest } from '@jest/globals';

import type { WordRequest } from '@6pm/domain';

import type { ApiClient } from '../api/api-client';
import { wordWithModel } from './word-chain';

jest.mock('../../../modules/companion-model', () => ({ companionModel: null }));

const request: WordRequest = {
  surface: 'bubble',
  language: 'en',
  persona: 'cheeky',
  facts: [
    {
      kind: 'repeatMerchant',
      slots: [
        { name: 'merchant', value: 'Highlands' },
        { name: 'visits', value: '4' },
      ],
    },
  ],
};

function server(answer: () => Promise<unknown>) {
  const send = jest.fn(answer);
  return { send, request: send as unknown as ApiClient['request'] };
}

describe('wordWithModel', () => {
  it('takes the server’s line when it passes the check', async () => {
    const { request: send } = server(() =>
      Promise.resolve({ text: '{merchant} again? {visits} since Monday', mood: 'think' }),
    );
    await expect(wordWithModel(request, { request: send, choice: 'server' })).resolves.toEqual({
      text: '{merchant} again? {visits} since Monday',
      mood: 'think',
    });
  });

  it('drops a line that writes a number itself, and the catalogue answers', async () => {
    const { request: send } = server(() =>
      Promise.resolve({ text: 'Highlands again? 4 since Monday', mood: 'think' }),
    );
    await expect(wordWithModel(request, { request: send, choice: 'server' })).resolves.toBeNull();
  });

  it('falls through to the server when this iPhone has no model, even when it is chosen first', async () => {
    const { send, request: sendRequest } = server(() =>
      Promise.resolve({ text: 'Another {merchant} run', mood: 'happy' }),
    );
    const line = await wordWithModel(request, { request: sendRequest, choice: 'device' });
    expect(line?.text).toBe('Another {merchant} run');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('answers null when no model answers', async () => {
    const { request: send } = server(() => Promise.reject(new Error('offline')));
    await expect(wordWithModel(request, { request: send, choice: 'server' })).resolves.toBeNull();
  });
});
