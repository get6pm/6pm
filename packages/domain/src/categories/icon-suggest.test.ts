import { describe, expect, it } from 'vitest';

import { categoryIconRequestSchema } from '../contracts/category-icon';
import { CATEGORY_ICONS, categoryIconMeaning, suggestCategoryIcon } from './icon-suggest';
import { EVERYDAY_ICON_WORDS } from './icon-words-everyday';

const FREE = Object.keys(EVERYDAY_ICON_WORDS);

describe('the icon a category name points to', () => {
  it.each([
    ['Food', 'restaurant'],
    ['Ăn uống', 'restaurant'],
    ['Cà phê', 'local_cafe'],
    ['ca phe', 'local_cafe'],
    ['CAFÉ', 'local_cafe'],
    ['Coffees', 'local_cafe'],
    ['Đi chợ', 'shopping_cart'],
    ['Groceries', 'shopping_cart'],
    ['Đi lại', 'two_wheeler'],
    ['Xăng xe', 'local_gas_station'],
    ['Tiền điện', 'bolt'],
    ['Điện thoại', 'smartphone'],
    ['Nhà hàng', 'restaurant'],
    ['Nhà cửa', 'home'],
    ['Sức khỏe', 'medical_services'],
    ['Giải trí', 'movie'],
    ['Thú cưng', 'pets'],
    ['Học phí', 'school'],
    ['Quà tặng', 'redeem'],
    ['Trả nợ', 'credit_card'],
    ['My dog', 'pets'],
  ])('reads %s as %s among the free icons', (name, icon) => {
    expect(suggestCategoryIcon(name, FREE)).toBe(icon);
  });

  it('chooses among every pack when they are offered', () => {
    expect(suggestCategoryIcon('Trà sữa')).toBe('local_cafe');
    expect(suggestCategoryIcon('Lẩu nướng')).toBe('kebab_dining');
    expect(suggestCategoryIcon('Cắt tóc')).toBe('spa');
    expect(suggestCategoryIcon('Barber', CATEGORY_ICONS)).toBe('content_cut');
    expect(suggestCategoryIcon('Đi chùa')).toBe('temple_buddhist');
    expect(suggestCategoryIcon('Đầu tư')).toBe('trending_up');
  });

  it('never offers an icon outside the ones given', () => {
    expect(suggestCategoryIcon('Barber', FREE)).toBeNull();
    expect(suggestCategoryIcon('Food', ['pets', 'not_an_icon'])).toBeNull();
  });

  it('matches whole words only, so a word inside another finds nothing', () => {
    expect(suggestCategoryIcon('Carpool lane')).toBeNull();
    expect(suggestCategoryIcon('Theodore', FREE)).toBeNull();
  });

  it('finds nothing in an empty or unknown name', () => {
    expect(suggestCategoryIcon('')).toBeNull();
    expect(suggestCategoryIcon('   ')).toBeNull();
    expect(suggestCategoryIcon('Zxqv')).toBeNull();
  });

  it('gives every icon a meaning and at least one word', () => {
    expect(CATEGORY_ICONS).toHaveLength(180);
    for (const icon of CATEGORY_ICONS) expect(categoryIconMeaning(icon)).not.toBe('');
  });
});

describe('the category icon request', () => {
  const icons = ['restaurant', 'local_cafe'];

  it('takes a trimmed name and icons from the packs', () => {
    expect(categoryIconRequestSchema.parse({ name: '  Phở  ', icons })).toEqual({
      name: 'Phở',
      icons,
    });
  });

  it.each([
    ['an empty name', { name: '  ', icons }],
    ['a name longer than a category name', { name: 'x'.repeat(41), icons }],
    ['an icon outside the packs', { name: 'Food', icons: ['restaurant', 'rocket'] }],
    ['a repeated icon', { name: 'Food', icons: ['restaurant', 'restaurant'] }],
    ['a single icon', { name: 'Food', icons: ['restaurant'] }],
  ])('turns away %s', (_, body) => {
    expect(categoryIconRequestSchema.safeParse(body).success).toBe(false);
  });
});
