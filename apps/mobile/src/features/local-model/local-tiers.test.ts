import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { localExplanation, localLineTier, localReading } from './local-tiers';

const mockReply: { text: string; ready: boolean } = { text: '', ready: true };
jest.mock('./local-generate', () => ({
  localGenerate: () => Promise.resolve(mockReply.text),
}));
jest.mock('./model-store', () => ({
  modelReady: () => Promise.resolve(mockReply.ready),
}));

function settings(model: string | null) {
  return {
    getFirstSync: <T>(_: string, [key]: unknown[]) =>
      (key === 'ai.localModel' && model !== null ? { value: model } : null) as T | null,
  };
}

const VND = { code: 'VND' } as never;

describe('the local tiers', () => {
  beforeEach(() => {
    mockReply.ready = true;
  });

  it('read with the phone’s amount, and say unknown without a ready model', async () => {
    mockReply.text = '{"query":{"kind":"afford","amount":300000000}}';
    const request = { question: 'mua con iphone 30 củ được không' };
    expect(await localReading(settings('gemma-4-e2b') as never, request, VND)).toEqual({
      kind: 'afford',
      amount: 30_000_000,
    });
    mockReply.ready = false;
    expect(await localReading(settings('gemma-4-e2b') as never, request, VND)).toEqual({
      kind: 'unknown',
    });
    expect(await localReading(settings(null) as never, request, VND)).toEqual({ kind: 'unknown' });
  });

  it('word a line with its values back as placeholders', async () => {
    mockReply.text = 'Payday is in 3 days, on Sat 31 Oct.';
    const line = await localLineTier(settings('gemma-4-e2b') as never)({
      surface: 'bubble',
      language: 'en',
      persona: 'plain',
      facts: [
        {
          kind: 'paydaySoon',
          slots: [
            { name: 'days', value: '3' },
            { name: 'payday', value: 'Sat 31 Oct' },
          ],
        },
      ],
    });
    expect(line.text).toBe('Payday is in {days} days, on {payday}.');
  });

  it('explain only in the language asked', async () => {
    mockReply.text = 'Lãi kép là khi tiền lãi cũng được tính lãi tiếp.';
    expect(await localExplanation(settings('gemma-4-e2b') as never, 'lãi kép là gì', 'vi')).toBe(
      mockReply.text,
    );
    expect(
      await localExplanation(settings('gemma-4-e2b') as never, 'what is compound interest', 'en'),
    ).toBeNull();
  });
});
