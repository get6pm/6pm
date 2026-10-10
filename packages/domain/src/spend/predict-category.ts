/**
 * The three categories most likely at this hour, offered first in Quick add: breakfast and coffee
 * in the morning, lunch around noon, drinks in the afternoon, dinner and groceries after five.
 */
export function likelyCategoriesAt(hour: number): readonly [string, string, string] {
  if (hour < 10) return ['Food', 'Drinks', 'Transport'];
  if (hour < 14) return ['Food', 'Transport', 'Drinks'];
  if (hour < 17) return ['Drinks', 'Food', 'Shopping'];
  return ['Food', 'Groceries', 'Transport'];
}
