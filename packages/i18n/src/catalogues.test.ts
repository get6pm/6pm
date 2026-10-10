import { describe, expect, it } from 'vitest';

import { findCatalogueProblems } from './completeness';
import { en } from './en';
import { pickLanguage } from './pick-language';
import { t } from './translate';
import { vi } from './vi';

describe('catalogue completeness', () => {
  it('has every English string in Vietnamese, with the same parameters and a real translation', () => {
    expect(findCatalogueProblems(en, vi)).toEqual([]);
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
