import { useState, type ReactNode } from 'react';
import { Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { spendDayRange, movedTo, type SpendRow } from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useWalletOptions } from '../quick-add/use-wallet-options';
import { useAutosavedNote, useAutosavedText } from './use-autosaved-note';
import { WhenPicker } from './when-picker';

/** One line of the card: a label on the left and what it holds on the right. */
function Line({ first, children }: { readonly first?: boolean; readonly children: ReactNode }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 16,
        paddingVertical: 13,
        borderTopWidth: 0.5,
        borderTopColor: first ? 'transparent' : palette.hair,
      }}
    >
      {children}
    </View>
  );
}

/**
 * The detail's card: the shop and when (both fixable), the pot, the wallet, the status, and the
 * note. Text saves as it is typed; the when wheels open under their row and save as they turn.
 */
export function DetailsCard({
  spend,
  when,
  onUpdate,
}: {
  readonly spend: SpendRow;
  /** "Wed 14 Oct · 08:15" */
  readonly when: string;
  readonly onUpdate: (patch: Partial<SpendRow>) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const snap = useMoney();
  const { now } = useClock();
  const wallets = useWalletOptions(spend.wallet);
  const [merchant, setMerchant] = useState(spend.merchant);
  const [note, setNote] = useState(spend.note ?? '');
  const shop = useAutosavedText(spend.id, spend.merchant, 'merchant');
  const autosave = useAutosavedNote(spend.id, spend.note ?? null);
  const [picking, setPicking] = useState(false);
  const range = spendDayRange(spend.day, {
    today: snap.today,
    cycleStart: snap.cycle.start,
    payday: snap.plan?.payday ?? { kind: 'lastDay' },
  });
  const statusLabel = (s: SpendRow['status']) =>
    s === 'kept'
      ? t('details.status.kept')
      : s === 'pending'
        ? t('details.status.pending')
        : s === 'caught'
          ? t('details.status.caught')
          : t('details.status.skipped');

  const fields: { key: string; label: string; value: string; onPress?: () => void }[] = [
    {
      key: 'when',
      label: t('details.when'),
      value: when,
      onPress: () => setPicking((open) => !open),
    },
    {
      key: 'pot',
      label: t('details.pot'),
      value: spend.forWork ? t('details.claimBack') : t('details.freeMoney'),
      onPress: () => onUpdate({ forWork: !spend.forWork }),
    },
    {
      key: 'wallet',
      label: t('details.paidWith'),
      value: wallets.find((w) => w.value === (spend.wallet ?? 'Cash'))?.label ?? spend.wallet ?? '',
      onPress: () => {
        const at = wallets.findIndex((w) => w.value === (spend.wallet ?? 'Cash'));
        onUpdate({ wallet: wallets[(at + 1) % wallets.length]?.value ?? null });
      },
    },
    { key: 'status', label: t('details.status'), value: statusLabel(spend.status) },
  ];
  const input = {
    flex: 1,
    textAlign: 'right',
    fontSize: 16,
    color: palette.ink,
    padding: 0,
  } as const;

  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        overflow: 'hidden',
      }}
    >
      <Line first>
        <Text style={{ ...body(16), color: palette.inkSoft }}>{t('details.shop')}</Text>
        <TextInput
          value={merchant}
          onChangeText={(text) => {
            setMerchant(text);
            shop.change(text);
          }}
          onEndEditing={() => {
            void shop.flush();
            // A blank shop keeps its name.
            if (merchant.trim() === '') setMerchant(spend.merchant);
          }}
          placeholder={t('details.shopPlaceholder')}
          placeholderTextColor={palette.inkSoft}
          returnKeyType="done"
          style={input}
        />
      </Line>
      {fields.map((f) => (
        <View key={f.key}>
          <PressScale
            highlight
            highlightBleed={16}
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
              borderTopColor: palette.hair,
            }}
          >
            <Text style={{ ...body(16), color: palette.inkSoft, flex: 1 }}>{f.label}</Text>
            <Text style={{ ...body(16, 550), color: palette.ink }}>{f.value}</Text>
            {f.onPress ? <Symbol name="unfold_more" size={18} color={palette.inkSoft} /> : null}
          </PressScale>
          {f.key === 'when' && picking ? (
            <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)}>
              <WhenPicker
                at={new Date(spend.at)}
                range={range}
                today={snap.today}
                now={now}
                onChange={(instant) => onUpdate(movedTo(instant))}
              />
            </Animated.View>
          ) : null}
        </View>
      ))}
      <Line>
        <Text style={{ ...body(16), color: palette.inkSoft }}>{t('details.note')}</Text>
        <TextInput
          value={note}
          onChangeText={(text) => {
            setNote(text);
            autosave.change(text);
          }}
          onEndEditing={autosave.flush}
          placeholder={t('details.notePlaceholder')}
          placeholderTextColor={palette.inkSoft}
          style={input}
        />
      </Line>
    </View>
  );
}
