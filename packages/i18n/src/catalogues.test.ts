import { describe, expect, it } from 'vitest';

import { findCatalogueProblems, findVariantProblems } from './completeness';
import { en } from './en';
import { enAndroid } from './en-android';
import { pickLanguage } from './pick-language';
import { t, translatorFor } from './translate';
import { vi } from './vi';
import { viAndroid } from './vi-android';

describe('catalogue completeness', () => {
  it('has every English string in Vietnamese, with the same parameters and a real translation', () => {
    expect(findCatalogueProblems(en, vi)).toEqual([]);
  });

  it('words every Android key in both languages, with the same parameters and a real translation', () => {
    expect(findCatalogueProblems(enAndroid, viAndroid)).toEqual([]);
  });

  it('varies only keys the catalogue has, keeping their shape and parameters', () => {
    expect(findVariantProblems(en, enAndroid)).toEqual([]);
    expect(findVariantProblems(vi, viAndroid)).toEqual([]);
  });

  it('flags an Android wording that drifts from the catalogue', () => {
    expect(
      findVariantProblems(
        { a: 'Hi {name}', b: { one: '{count} day', other: '{count} days' }, c: 'Same' },
        { a: 'Hello', b: 'days', c: 'Same', d: 'Extra' },
      ),
    ).toEqual([
      'a: parameters differ ({name} against {})',
      'b: plural in one of them only',
      'c: the same as the catalogue',
      'd: not in the catalogue',
    ]);
  });

  it('never names Apple’s things in Android’s own wording', () => {
    const apple =
      /iPhone|App Store|Apple ID|iCloud|Siri|Lock Screen|Home Screen|Shortcuts|\bPhotos\b/;
    for (const entry of [...Object.values(enAndroid), ...Object.values(viAndroid)]) {
      for (const text of typeof entry === 'string' ? [entry] : Object.values(entry)) {
        expect(text).not.toMatch(apple);
      }
    }
  });
});

describe('translatorFor', () => {
  it('reads Android’s own wording on Android and the catalogue’s everywhere else', () => {
    const android = translatorFor('android');
    expect(android('en', 'scan.handoff.store', { wallet: 'MB Bank' })).toBe(
      'MB Bank isn’t on this phone',
    );
    expect(translatorFor('ios')('en', 'scan.handoff.store', { wallet: 'MB Bank' })).toBe(
      'MB Bank isn’t on this iPhone',
    );
    expect(android('vi', 'today.meterUsed', { spent: '302k', line: '351k' })).toBe(
      'Đã dùng 302k / 351k',
    );
  });

  it('picks an Android plural form from the count', () => {
    expect(translatorFor('android')('en', 'backup.restore.sub', { count: 1 })).toBe(
      '1 item · encrypted.',
    );
  });
});

describe('t', () => {
  it('fills placeholders in the asked language', () => {
    expect(t('en', 'today.meterUsed', { spent: '302k', line: '351k' })).toBe('302k of 351k used');
    expect(t('vi', 'today.meterUsed', { spent: '302k', line: '351k' })).toBe('Đã dùng 302k / 351k');
  });

  it('picks plural forms from the count', () => {
    expect(t('en', 'today.inbox.waiting', { count: 1 })).toBe('1 waiting in Inbox');
    expect(t('vi', 'today.inbox.waiting', { count: 4 })).toBe('4 khoản đang chờ trong Inbox');
  });
});

describe('pickLanguage', () => {
  it('follows the device, a stored choice wins, English is the fallback', () => {
    expect(pickLanguage(['vi-VN', 'en-US'])).toBe('vi');
    expect(pickLanguage(['en-GB', 'vi-VN'])).toBe('en');
    expect(pickLanguage(['vi-VN'], 'en')).toBe('en');
    expect(pickLanguage(['fr-FR'])).toBe('en');
  });
});
