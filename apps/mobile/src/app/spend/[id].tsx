import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import type { SpendRow } from '@6pm/domain';
import { oklchSrgbHex } from '@6pm/theme';

import { useMoney, useMoneyActions } from '../../data/money-provider';
import { findSpend } from '../../data/money-store';
import type { Sighting } from '../../data/money-actions';
import { merchantIcon } from '../../features/today/merchant-icon';
import { useSpendLabels } from '../../features/today/use-spend-rows';
import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { haptics } from '../../ui/haptics';
import { isSymbolName } from '../../ui/icons/symbol';
import { SheetScreen } from '../../ui/navigation/sheet-screen';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { CategoryChips } from '../../features/details/category-chips';
import { RulePrompt } from '../../features/details/rule-prompt';
import { SourceTrail } from '../../features/details/source-trail';
import { useOfferUndo } from '../../ui/undo/undo-host';
import { useCompanionToast } from '../../features/companion/use-companion-toast';
import { useRunAction } from '../../features/companion/use-run-action';
import { AmountEditor } from '../../features/details/amount-editor';
import { DetailsCard } from '../../features/details/details-card';
import { useFocusOnPresent } from '../../ui/navigation/use-focus-on-present';
import { easeInOut } from '../../ui/motion/curves';

const DELETE_RED = oklchSrgbHex(0.64, 0.19, 25);
/** Everything under the rule prompt moves as it comes and goes, instead of jumping. */
const reflow = LinearTransition.duration(200).easing(easeInOut);

/** One spend: what it was, how much, its category, where it came from, and delete with undo. */
export default function SpendDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette } = useTheme();
  const { t, language, weekdayDate } = useI18n();
  const snap = useMoney();
  const actions = useMoneyActions();
  const labels = useSpendLabels();
  const offerUndo = useOfferUndo();
  const say = useCompanionToast();
  const run = useRunAction();
  const spend = findSpend(snap, id);
  const [askRule, setAskRule] = useState(false);
  // A catch with no amount opens on the keypad, once the sheet has risen.
  const [editingAmount, setEditingAmount] = useState(false);
  const amountField = useRef({ focus: () => setEditingAmount(true) });
  useFocusOnPresent(amountField, spend !== undefined && spend.amount <= 0);
  // Every way the spend was seen. A merge changes the row, so it is read again then.
  const [sightings, setSightings] = useState<readonly Sighting[]>([]);
  const sightingsOf = spend?.id;
  const stamp = spend?.updatedAt;
  useEffect(() => {
    if (!sightingsOf) return;
    let live = true;
    actions
      .sightings(sightingsOf)
      .then((rows) => live && setSightings(rows))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [actions, sightingsOf, stamp]);
  if (!spend) return <SheetScreen title={t('details.title')} />;

  const category = snap.categories.find((c) => c.id === spend.categoryId);
  const icon = merchantIcon(
    spend.merchant,
    category && isSymbolName(category.icon) ? category.icon : 'payments',
  );
  const locale = language === 'vi' ? 'vi-VN' : 'en-GB';
  const when = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date(spend.at));
  const update = (patch: Partial<SpendRow>) => void run(() => actions.update(spend.id, patch));

  // One line per way it was seen, headed "Seen 2 ways" when more than one source reported it.
  const trail =
    sightings.length > 1
      ? [
          t('details.seenWays', {
            count: sightings.length,
            sources: [...new Set(sightings.map((s) => labels.source(s.source)))].join(' + '),
          }),
          ...sightings.map((s) =>
            [labels.time(s.seenAt), labels.source(s.source), s.detail].filter(Boolean).join(' · '),
          ),
        ]
      : [
          spend.detail,
          t('details.added', {
            time: labels.time(spend.createdAt),
            source: labels.source(spend.source),
          }),
        ].filter((line): line is string => Boolean(line));

  return (
    <SheetScreen title={t('details.title')}>
      <View style={{ alignItems: 'center', gap: 6, paddingVertical: 4 }}>
        <CategoryTile icon={icon} hue={category?.hue ?? 80} size={56} radius={19} glyph={31} />
        <Text style={{ ...body(20, 650, -0.02), color: palette.ink, paddingTop: 4 }}>
          {spend.merchant}
        </Text>
        <Text style={{ ...body(14), color: palette.inkSoft }}>
          {when} · {labels.time(spend.at)}
        </Text>
        <AmountEditor
          spend={spend}
          editing={editingAmount}
          onEditing={setEditingAmount}
          onSave={({ amount, foreignAmount }) => update({ amount, foreignAmount })}
        />
        <Animated.View
          layout={reflow}
          style={{ alignSelf: 'stretch', alignItems: 'center', gap: 6 }}
        >
          <CategoryChips
            categories={snap.categories}
            selected={spend.categoryId}
            onPick={(categoryId) => {
              update({ categoryId });
              setAskRule(true);
            }}
          />
          {askRule && category ? (
            <RulePrompt
              text={t('rule.ask', { merchant: spend.merchant, category: category.name })}
              once={t('rule.once')}
              always={t('rule.always')}
              onOnce={() => setAskRule(false)}
              onAlways={() => {
                setAskRule(false);
                void run(() => actions.rememberMerchant(spend.merchant, category.id)).then(
                  (saved) => {
                    if (saved) say('ruleSaved');
                  },
                );
              }}
            />
          ) : null}
        </Animated.View>
      </View>

      <Animated.View layout={reflow} style={{ gap: 22 }}>
        <DetailsCard
          key={spend.id}
          spend={spend}
          when={`${weekdayDate(new Date(`${spend.day}T12:00:00`))} · ${labels.time(spend.at)}`}
          onUpdate={update}
        />

        <SourceTrail title={t('details.sourceTrail')} lines={trail} />

        <View style={{ gap: 8, alignItems: 'center' }}>
          <PressScale
            scaleTo={0.97}
            onPress={() => {
              haptics.tap();
              void run(() => actions.setStatus(spend.id, 'deleted')).then((saved) => {
                if (!saved) return;
                offerUndo(
                  t('undo.deleted', { name: spend.merchant }),
                  t('undo.action'),
                  () => void run(() => actions.undo(spend.id)),
                );
                router.back();
              });
            }}
            style={{
              alignSelf: 'stretch',
              height: 52,
              borderRadius: 18,
              borderWidth: 0.5,
              borderColor: palette.hair,
              backgroundColor: palette.cell,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(16, 600), color: DELETE_RED }}>{t('details.delete')}</Text>
          </PressScale>
          <Text style={{ ...body(13), color: palette.inkSoft }}>{t('details.undoHint')}</Text>
        </View>
      </Animated.View>
    </SheetScreen>
  );
}
