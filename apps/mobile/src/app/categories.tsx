import { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import { formatShort, type MerchantRuleRow } from '@6pm/domain';

import {
  fallbackFor,
  tallyByCategory,
  useCategoryActions,
  type CategoryInput,
} from '../data/category-actions';
import { useMoney } from '../data/money-provider';
import { CategoryEditor } from '../features/categories/category-editor';
import { CategoryListRow, ListSection, NewCategoryRow } from '../features/categories/category-list';
import { NoRules, RuleListRow } from '../features/categories/rule-list';
import { useCompanionToast } from '../features/companion/use-companion-toast';
import { useI18n } from '../i18n/i18n';
import { haptics } from '../ui/haptics';
import { SheetScreen } from '../ui/navigation/sheet-screen';
import { useTheme } from '../ui/theme/theme';
import { body } from '../ui/type/fonts';

interface Editing {
  /** Null for a new category. */
  readonly id: string | null;
  readonly initial: CategoryInput;
  readonly title: string;
  readonly deleteLabel: string | null;
}

const NEW_CATEGORY: CategoryInput = { name: '', icon: 'pets', hue: 200, countsDaily: true };

/**
 * Categories & rules: every category with this month's tally, the editor to make or change one,
 * and the merchants 6pm has learned to file, each one forgettable.
 */
export default function Categories() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const snap = useMoney();
  const actions = useCategoryActions();
  const say = useCompanionToast();
  const [rules, setRules] = useState<readonly MerchantRuleRow[]>([]);
  const [editing, setEditing] = useState<Editing | null>(null);
  const { categories } = snap;
  const tallies = useMemo(() => tallyByCategory(snap.cycleSpends), [snap.cycleSpends]);

  useEffect(() => {
    let live = true;
    void actions.readRules().then((next) => {
      if (live) setRules(next);
    });
    return () => {
      live = false;
    };
  }, [actions, categories]);

  const edit = (id: string | null) => {
    const category = id ? categories.find((c) => c.id === id) : undefined;
    const fallback = category ? fallbackFor(categories, category.id) : undefined;
    setEditing({
      id: category?.id ?? null,
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
    });
  };

  const save = (draft: CategoryInput) => {
    const id = editing?.id ?? undefined;
    haptics.success();
    void actions.saveCategory(draft, id).then((row) => {
      if (row) say('catSaved');
    });
  };

  const remove = () => {
    if (!editing?.id) return;
    haptics.tap();
    void actions.deleteCategory(editing.id);
  };

  const forget = (merchantKey: string) => {
    haptics.tap();
    void actions.removeRule(merchantKey).then(() => {
      setRules((current) => current.filter((r) => r.merchantKey !== merchantKey));
    });
  };

  const shownRules = rules.flatMap((rule) => {
    const category = categories.find((c) => c.id === rule.categoryId);
    return category ? [{ rule, category }] : [];
  });
  return (
    <>
      <SheetScreen title={t('categories.title')} gap={24}>
        <Text
          style={{
            ...body(15),
            lineHeight: 15 * 1.45,
            color: palette.inkSoft,
            paddingHorizontal: 6,
          }}
        >
          {t('categories.intro')}
        </Text>
        <LayoutAnimationConfig skipEntering>
          <ListSection
            title={t('categories.yours')}
            note={t('categories.count', { count: categories.length })}
          >
            {categories.map((category, i) => {
              const tally = tallies.get(category.id);
              return (
                <CategoryListRow
                  key={category.id}
                  category={category}
                  sub={
                    tally
                      ? t('categories.tally', {
                          count: tally.count,
                          amount: formatShort(tally.total),
                        })
                      : t('categories.tallyNone')
                  }
                  notDailyLabel={t('categories.notDaily')}
                  first={i === 0}
                  onPress={() => edit(category.id)}
                />
              );
            })}
            <NewCategoryRow label={t('categories.new')} onPress={() => edit(null)} />
          </ListSection>
        </LayoutAnimationConfig>
        <ListSection
          title={t('categories.learned')}
          note={shownRules.length ? t('categories.rulesCount', { count: shownRules.length }) : ''}
          footer={t('categories.rulesNote')}
        >
          {shownRules.map(({ rule, category }, i) => (
            <RuleListRow
              key={rule.merchantKey}
              merchant={rule.merchant}
              category={category}
              sub={
                rule.learnedTimes > 0
                  ? t('categories.rule.learned', { count: rule.learnedTimes })
                  : t('categories.rule.set')
              }
              removeLabel={t('categories.rule.remove', { merchant: rule.merchant })}
              first={i === 0}
              onRemove={() => forget(rule.merchantKey)}
            />
          ))}
          {shownRules.length === 0 ? <NoRules text={t('categories.noRules')} /> : null}
        </ListSection>
      </SheetScreen>
      {editing ? (
        <CategoryEditor
          initial={editing.initial}
          title={editing.title}
          deleteLabel={editing.deleteLabel}
          onSave={save}
          onDelete={remove}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}
