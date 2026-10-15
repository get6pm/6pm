import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import { type MerchantRuleRow } from '@6pm/domain';

import { tallyByCategory, useCategoryActions } from '../data/category-actions';
import { useMoney } from '../data/money-provider';
import { CategoryListRow, ListSection, NewCategoryRow } from '../features/categories/category-list';
import { NoRules, RuleListRow } from '../features/categories/rule-list';
import { useI18n } from '../i18n/i18n';
import { useMoneyFormat } from '../money/use-money-format';
import { haptics } from '../ui/haptics';
import { SheetScreen } from '../ui/navigation/sheet-screen';
import { useTheme } from '../ui/theme/theme';
import { body } from '../ui/type/fonts';

/**
 * Categories & rules: every category with this month's tally, the editor to make or change one,
 * and the merchants 6pm has learned to file, each one forgettable.
 */
export default function Categories() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const money = useMoneyFormat();
  const snap = useMoney();
  const actions = useCategoryActions();
  const router = useRouter();
  const [rules, setRules] = useState<readonly MerchantRuleRow[]>([]);
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

  // The editor floats over this sheet on its own route; `new` makes a category.
  const edit = (id: string | null) =>
    router.push({ pathname: '/category/[id]', params: { id: id ?? 'new' } });

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
                        amount: money.short(tally.total),
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
  );
}
