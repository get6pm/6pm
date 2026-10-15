import { describe, expect, it, jest } from '@jest/globals';

import type { InboxSpend } from '@6pm/domain';

import type { ApiRequest } from '../api/api-client';
import { ApiRequestError } from '../api/api-error';
import type { AiMode } from '../privacy/ai-mode';
import { aiModeSettings } from '../privacy/ai-mode-stand-in';
import { createEnrichShared, NAME_MERCHANT_TIMEOUT_MS } from './enrich-shared';

const shared = (receipt: Partial<NonNullable<InboxSpend['receipt']>> = {}): InboxSpend => ({
  v: 1,
  id: '0b6f3f8e-2a4c-4d7e-9f10-8a1b2c3d4e5f',
  kind: 'spend',
  source: 'shared',
  status: 'caught',
  at: '2026-10-09T09:40:00.000Z',
  amount: 120_000,
  merchant: 'CONG TY TNHH VONG TRON DO',
  categoryId: null,
  receipt: {
    bank: 'Vietcombank',
    code: 'FT26282917400',
    namingLines: ['Tên người nhận', 'CONG TY TNHH VONG TRON DO', 'Số tài khoản'],
    payeeSure: false,
    ...receipt,
  },
});

const categories = [
  { id: 'food', name: 'Food' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'tet', name: 'Tết 2027' },
];

function setup(
  answer: () => Promise<unknown>,
  ruled: string | null = null,
  mode: AiMode = 'server',
) {
  const request = jest.fn((call: ApiRequest<unknown>) => {
    void call;
    return answer();
  });
  const enrich = createEnrichShared({
    request: request as never,
    settings: aiModeSettings(mode),
    ruleCategory: () => Promise.resolve(ruled),
    categories: () => categories,
  });
  return { enrich, request };
}

describe('naming a shared receipt', () => {
  it('asks the server once, briefly, with no digit, and takes the name it gives', async () => {
    const { enrich, request } = setup(() =>
      Promise.resolve({ merchant: 'Circle K', category: 'Shopping' }),
    );
    const named = await enrich(shared());
    expect(named).toMatchObject({ merchant: 'Circle K', categoryId: 'shopping' });
    expect(request).toHaveBeenCalledTimes(1);
    const call = request.mock.calls[0]?.[0];
    expect(call).toMatchObject({
      method: 'POST',
      path: '/v1/name-merchant',
      timeoutMs: NAME_MERCHANT_TIMEOUT_MS,
      body: { categories: ['Food', 'Shopping'] },
    });
    expect(JSON.stringify(call?.body)).not.toMatch(/\d/);
  });

  it('keeps the category the extension filed', async () => {
    const { enrich } = setup(() => Promise.resolve({ merchant: 'Circle K', category: 'Food' }));
    const item = { ...shared(), categoryId: 'shopping' };
    expect(await enrich(item)).toMatchObject({ merchant: 'Circle K', categoryId: 'shopping' });
  });

  it('leaves a sure name, a name a rule knows, and an older file alone', async () => {
    const answer = () => Promise.resolve({ merchant: 'Circle K', category: 'Food' });
    const sure = setup(answer);
    expect(await sure.enrich(shared({ payeeSure: true }))).toEqual(shared({ payeeSure: true }));
    const older = shared();
    delete older.receipt?.payeeSure;
    expect(await sure.enrich(older)).toEqual(older);
    expect(sure.request).not.toHaveBeenCalled();

    const ruled = setup(answer, 'shopping');
    expect(await ruled.enrich(shared())).toEqual(shared());
    expect(ruled.request).not.toHaveBeenCalled();
  });

  it('keeps the read name offline, on a timeout, or when the receipt does not say', async () => {
    const offline = setup(() =>
      Promise.reject(new ApiRequestError('network', 'POST /v1/name-merchant', true)),
    );
    expect(await offline.enrich(shared())).toEqual(shared());
    const silent = setup(() => Promise.resolve({ merchant: ' ', category: 'Food' }));
    expect(await silent.enrich(shared())).toMatchObject({
      merchant: 'CONG TY TNHH VONG TRON DO',
      categoryId: 'food',
    });
  });

  it('sends nothing when no line is free of numbers', async () => {
    const { enrich, request } = setup(() =>
      Promise.resolve({ merchant: 'Circle K', category: 'Food' }),
    );
    expect(await enrich(shared({ namingLines: ['STK 0071'] }))).toEqual(
      shared({ namingLines: ['STK 0071'] }),
    );
    expect(request).not.toHaveBeenCalled();
  });

  it('sends nothing in on-device mode: the receipt keeps the name the phone read', async () => {
    const { enrich, request } = setup(
      () => Promise.resolve({ merchant: 'Circle K', category: 'Shopping' }),
      null,
      'device',
    );
    const item = shared();
    expect(await enrich(item)).toEqual(item);
    expect(request).not.toHaveBeenCalled();
  });
});
