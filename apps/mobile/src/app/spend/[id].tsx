import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { groupDigits, type SpendRow } from '@6pm/domain';
import { oklchSrgbHex } from '@6pm/theme';

import { useMoney, useMoneyActions } from '../../data/money-provider';
import { merchantIcon } from '../../features/today/merchant-icon';
import { useSpendLabels } from '../../features/today/use-spend-rows';
import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { haptics } from '../../ui/haptics';
import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { SheetScreen } from '../../ui/navigation/sheet-screen';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, tabular } from '../../ui/type/fonts';
import { RulePrompt } from '../../features/details/rule-prompt';
import { SourceTrail } from '../../features/details/source-trail';
import { useOfferUndo } from '../../ui/undo/undo-host';

const WALLETS = ['Cash', 'MB Bank', 'Vietcombank', 'MoMo'];
const DELETE_RED = oklchSrgbHex(0.64, 0.19, 25);

/** One spend: what it was, how much, its category, where it came from, and delete with undo. */
export default function SpendDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const snap = useMoney();
  const actions = useMoneyActions();
  const labels = useSpendLabels();
  const offerUndo = useOfferUndo();
  const spend = snap.cycleSpends.find((s) => s.id === id);
  const [askRule, setAskRule] = useState(false);
  const [note, setNote] = useState(spend?.note ?? '');
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
  const statusLabel = (s: SpendRow['status']) =>
    s === 'kept'
      ? t('details.status.kept')
      : s === 'pending'
        ? t('details.status.pending')
        : s === 'caught'
          ? t('details.status.caught')
          : t('details.status.skipped');
  const update = (patch: Partial<SpendRow>) => void actions.update(spend.id, patch);

  const fields: { key: string; label: string; value: string; onPress?: () => void }[] = [
    {
      key: 'pot',
      label: t('details.pot'),
      value: spend.forWork ? t('details.claimBack') : t('details.freeMoney'),
      onPress: () => update({ forWork: !spend.forWork }),
    },
    {
      key: 'wallet',
      label: t('details.paidWith'),
      value: spend.wallet ?? WALLETS[0] ?? '',
      onPress: () =>
        update({
          wallet: WALLETS[(WALLETS.indexOf(spend.wallet ?? 'Cash') + 1) % WALLETS.length] ?? null,
        }),
    },
    { key: 'status', label: t('details.status'), value: statusLabel(spend.status) },
  ];
  const trail = [
    spend.detail,
    t('details.added', { time: labels.time(spend.createdAt), source: labels.source(spend.source) }),
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
        <Text
          style={{
            ...display(72, 500, -0.02),
            ...tabular,
            lineHeight: 72,
            color: palette.ink,
            paddingTop: 8,
          }}
        >
          {groupDigits(spend.amount)}
          <Text style={{ ...display(29, 500), opacity: 0.55 }}>{' ₫'}</Text>
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 6,
            paddingTop: 12,
          }}
        >
          {snap.categories.map((c) => {
            const on = c.id === spend.categoryId;
            return (
              <PressScale
                key={c.id}
                onPress={() => {
                  if (on) return;
                  haptics.tick();
                  update({ categoryId: c.id });
                  setAskRule(true);
                }}
                style={{
                  height: 34,
                  paddingLeft: 9,
                  paddingRight: 12,
                  borderRadius: 99,
                  backgroundColor: on ? palette.btnBg : palette.chipBg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {isSymbolName(c.icon) ? (
                  <Symbol
                    name={c.icon}
                    size={17}
                    fill={1}
                    color={on ? palette.btnFg : palette.ink}
                  />
                ) : null}
                <Text style={{ ...body(13, 600), color: on ? palette.btnFg : palette.ink }}>
                  {c.name}
                </Text>
              </PressScale>
            );
          })}
        </View>
        {askRule && category ? (
          <RulePrompt
            text={t('rule.ask', { merchant: spend.merchant, category: category.name })}
            once={t('rule.once')}
            always={t('rule.always')}
            onOnce={() => setAskRule(false)}
            onAlways={() => {
              void actions.rememberMerchant(spend.merchant, category.id);
              setAskRule(false);
            }}
          />
        ) : null}
      </View>

      <View
        style={{
          borderRadius: 26,
          backgroundColor: palette.cell,
          boxShadow: palette.cardShadow,
          overflow: 'hidden',
        }}
      >
        {fields.map((f, i) => (
          <PressScale
            key={f.key}
            scaleTo={1}
            disabled={!f.onPress}
            onPress={() => {
              haptics.tick();
              f.onPress?.();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginHorizontal: 16,
              paddingVertical: 13,
              borderTopWidth: 0.5,
              borderTopColor: i === 0 ? 'transparent' : palette.hair,
            }}
          >
            <Text style={{ ...body(16), color: palette.inkSoft, flex: 1 }}>{f.label}</Text>
            <Text style={{ ...body(16, 550), color: palette.ink }}>{f.value}</Text>
            {f.onPress ? <Symbol name="unfold_more" size={18} color={palette.inkSoft} /> : null}
          </PressScale>
        ))}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
            marginHorizontal: 16,
            paddingVertical: 13,
            borderTopWidth: 0.5,
            borderTopColor: palette.hair,
          }}
        >
          <Text style={{ ...body(16), color: palette.inkSoft }}>{t('details.note')}</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            onEndEditing={() => update({ note: note.trim() || null })}
            placeholder={t('details.notePlaceholder')}
            placeholderTextColor={palette.inkSoft}
            style={{ flex: 1, textAlign: 'right', fontSize: 16, color: palette.ink, padding: 0 }}
          />
        </View>
      </View>

      <SourceTrail title={t('details.sourceTrail')} lines={trail} />

      <View style={{ gap: 8, alignItems: 'center' }}>
        <PressScale
          scaleTo={0.97}
          onPress={() => {
            haptics.tap();
            void actions.setStatus(spend.id, 'deleted');
            offerUndo(
              t('undo.deleted', { name: spend.merchant }),
              t('undo.action'),
              () => void actions.undo(spend.id),
            );
            router.back();
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
    </SheetScreen>
  );
}
