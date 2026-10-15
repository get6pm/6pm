import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { WordRequest } from '@6pm/domain';

import type { ApiClient } from '../api/api-client';
import { aiModeSettings } from '../privacy/ai-mode-stand-in';
import { wordWithModel } from './word-chain';

const serverMode = aiModeSettings('server');
const deviceMode = aiModeSettings('device');

/** This iPhone's model: null for one without it. */
const mockDevice: { model: unknown } = { model: null };
jest.mock('../../../modules/companion-model', () => ({
  get companionModel() {
    return mockDevice.model;
  },
}));

function deviceAnswering(text: string) {
  const word = jest.fn(() => Promise.resolve(JSON.stringify({ text, mood: 'nod' })));
  mockDevice.model = { availability: () => 'available', word };
  return word;
}

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
  beforeEach(() => {
    mockDevice.model = null;
  });

  it('takes the server’s line when it passes the check', async () => {
    const { request: send } = server(() =>
      Promise.resolve({ text: '{merchant} again? {visits} since Monday', mood: 'think' }),
    );
    await expect(
      wordWithModel(request, { request: send, choice: 'server', settings: serverMode }),
    ).resolves.toEqual({
      text: '{merchant} again? {visits} since Monday',
      mood: 'think',
    });
  });

  it('drops a line that writes a number itself, and the catalogue answers', async () => {
    const { request: send } = server(() =>
      Promise.resolve({ text: 'Highlands again? 4 since Monday', mood: 'think' }),
    );
    await expect(
      wordWithModel(request, { request: send, choice: 'server', settings: serverMode }),
    ).resolves.toBeNull();
  });

  it('falls through to the server when this iPhone has no model, even when it is chosen first', async () => {
    const { send, request: sendRequest } = server(() =>
      Promise.resolve({ text: 'Another {merchant} run this week', mood: 'happy' }),
    );
    const line = await wordWithModel(request, {
      request: sendRequest,
      choice: 'device',
      settings: serverMode,
    });
    expect(line?.text).toBe('Another {merchant} run this week');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('takes the on-device line first when it is chosen', async () => {
    deviceAnswering('{merchant} again, {visits} since Monday');
    const { send, request: sendRequest } = server(() => Promise.reject(new Error('offline')));
    const line = await wordWithModel(request, {
      request: sendRequest,
      choice: 'device',
      settings: serverMode,
    });
    expect(line?.text).toBe('{merchant} again, {visits} since Monday');
    expect(send).not.toHaveBeenCalled();
  });

  it('never asks the on-device model in place of the server: offline, the catalogue answers', async () => {
    const word = deviceAnswering('{merchant} again, {visits} since Monday');
    const { request: send } = server(() => Promise.reject(new Error('offline')));
    await expect(
      wordWithModel(request, { request: send, choice: 'server', settings: serverMode }),
    ).resolves.toBeNull();
    expect(word).not.toHaveBeenCalled();
  });

  it('drops a fragment the on-device model wrote', async () => {
    deviceAnswering('{visits}');
    const { request: send } = server(() => Promise.reject(new Error('offline')));
    await expect(
      wordWithModel(request, { request: send, choice: 'device', settings: serverMode }),
    ).resolves.toBeNull();
  });

  it('answers null when no model answers', async () => {
    const { request: send } = server(() => Promise.reject(new Error('offline')));
    await expect(
      wordWithModel(request, { request: send, choice: 'server', settings: serverMode }),
    ).resolves.toBeNull();
  });
});

describe('wordWithModel in on-device mode', () => {
  beforeEach(() => {
    mockDevice.model = null;
  });

  it('never asks the server: without a local model the catalogue answers', async () => {
    const { send, request: sendRequest } = server(() =>
      Promise.resolve({ text: 'Another {merchant} run this week', mood: 'happy' }),
    );
    for (const choice of ['server', 'device'] as const) {
      await expect(
        wordWithModel(request, { request: sendRequest, choice, settings: deviceMode }),
      ).resolves.toBeNull();
    }
    expect(send).not.toHaveBeenCalled();
  });

  it('takes the local model’s line, checked like any other', async () => {
    const { send, request: sendRequest } = server(() => Promise.reject(new Error('unused')));
    const local = jest.fn((_: WordRequest) =>
      Promise.resolve({ text: '{merchant} again, {visits} since Monday', mood: 'nod' as const }),
    );
    const line = await wordWithModel(request, {
      request: sendRequest,
      choice: 'server',
      settings: deviceMode,
      local,
    });
    expect(line?.text).toBe('{merchant} again, {visits} since Monday');
    expect(local).toHaveBeenCalledWith(request);
    expect(send).not.toHaveBeenCalled();
  });

  it('drops a local line that writes a number itself, and the catalogue answers', async () => {
    const { request: sendRequest } = server(() => Promise.reject(new Error('unused')));
    const local = () => Promise.resolve({ text: 'Highlands again? 4 times', mood: 'nod' as const });
    await expect(
      wordWithModel(request, {
        request: sendRequest,
        choice: 'server',
        settings: deviceMode,
        local,
      }),
    ).resolves.toBeNull();
  });
});
