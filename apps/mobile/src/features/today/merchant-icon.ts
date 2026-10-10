import type { SymbolName } from '../../ui/icons/symbols.generated';

/** Merchants recognised by name get their own glyph; everything else wears its category's. */
const MERCHANT_ICONS: readonly [RegExp, SymbolName][] = [
  [/phở|bún|hủ tiếu/, 'ramen_dining'],
  [/bánh mì/, 'bakery_dining'],
  [/cà phê|coffee|highlands/, 'coffee'],
  [/trà|milk tea/, 'emoji_food_beverage'],
  [/grab|ride/, 'two_wheeler'],
  [/circle k|gs25/, 'local_convenience_store'],
  [/parking/, 'local_parking'],
  [/mía|juice/, 'local_drink'],
  [/xôi|cơm/, 'rice_bowl'],
  [/market|veggies/, 'shopping_basket'],
  [/gift/, 'redeem'],
];

export function merchantIcon(merchant: string, categoryIcon: SymbolName): SymbolName {
  const name = merchant.toLowerCase();
  return MERCHANT_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? categoryIcon;
}
