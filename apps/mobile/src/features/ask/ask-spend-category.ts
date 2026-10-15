import { categoryHintOf, likelyCategoriesAt, matchCategory } from '@6pm/domain';

/**
 * Where a spend logged from Ask goes, as Quick add and email captures decide it: a rule the user
 * taught 6pm for that name, then a category the question named, then what the words point to,
 * then what is usual at this hour, then the first category.
 */
export function spendCategoryOf(
  input: {
    readonly name: string;
    readonly named: string | null;
    readonly learned: string | null;
    readonly hour: number;
  },
  categories: readonly { readonly id: string; readonly name: string }[],
): string {
  const has = (id: string | null | undefined) =>
    id ? categories.find((c) => c.id === id)?.id : undefined;
  const named = input.named === null ? null : matchCategory(input.named, categories);
  const likely = likelyCategoriesAt(input.hour).map((n) => n.toLowerCase());
  return (
    has(input.learned) ??
    named?.id ??
    has(categoryHintOf(input.name)) ??
    categories.find((c) => likely.includes(c.id))?.id ??
    categories[0]?.id ??
    'food'
  );
}
