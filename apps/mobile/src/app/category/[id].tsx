import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { fallbackFor, useCategoryActions, type CategoryInput } from '../../data/category-actions';
import { useMoney } from '../../data/money-provider';
import { CategoryEditor } from '../../features/categories/category-editor';
import { useCompanionToast } from '../../features/companion/use-companion-toast';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';

const NEW_CATEGORY: CategoryInput = { name: '', icon: 'pets', hue: 200, countsDaily: true };

/**
 * The card that makes (`new`) or edits a category, floating over the Categories sheet on its own
 * transparent modal so it dims the whole screen rather than being drawn inside the sheet. An id
 * that is no longer a category opens the card for a new one.
 */
export default function CategoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { categories } = useMoney();
  const actions = useCategoryActions();
  const say = useCompanionToast();
  // Read once: a deleted category leaves the snapshot while the card is still on its way out.
  const [shown] = useState(() => {
    const category = categories.find((c) => c.id === id);
    const fallback = category ? fallbackFor(categories, category.id) : undefined;
    return {
      id: category?.id,
      initial: category
        ? {
            name: category.name,
            icon: category.icon,
            hue: category.hue,
            countsDaily: category.countsDaily,
          }
        : NEW_CATEGORY,
      title: category ? t('categories.edit.title') : t('categories.new'),
      deleteLabel: fallback ? t('categories.edit.delete', { name: fallback.name }) : null,
    };
  });

  const save = (draft: CategoryInput) => {
    haptics.success();
    void actions.saveCategory(draft, shown.id).then((row) => {
      if (row) say('catSaved');
    });
  };

  const remove = () => {
    if (!shown.id) return;
    haptics.tap();
    void actions.deleteCategory(shown.id);
  };

  return (
    <CategoryEditor
      initial={shown.initial}
      title={shown.title}
      deleteLabel={shown.deleteLabel}
      onSave={save}
      onDelete={remove}
      onClose={() => router.back()}
    />
  );
}
