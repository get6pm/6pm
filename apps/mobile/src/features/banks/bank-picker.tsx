import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { BANKS, findBank, type BankInfo } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { body } from '../../ui/type/fonts';
import { Grid3 } from '../onboarding/step-parts';
import { BankRow, PickerLabel, QuickTile, SearchField, type PickerInks } from './bank-picker-parts';
import { CASH, quickPicks } from './bank-ranking';
import { searchBanks } from './bank-search';
import { readDeviceRegion } from './device-region';

const known = (id: string) => findBank(id) !== null;

/** Every bank and wallet, A to Z by the name people use. */
const ALL_BANKS: readonly BankInfo[] = [...BANKS].sort((a, b) =>
  a.shortName.localeCompare(b.shortName, 'vi', { sensitivity: 'base' }),
);

const listMotion = LinearTransition.duration(220);

function BankList({
  banks,
  chosen,
  inks,
  animate,
  onToggle,
}: {
  readonly banks: readonly BankInfo[];
  readonly chosen: readonly string[];
  readonly inks: PickerInks;
  /** Rows of search results come and go as the query changes; the full list stays put. */
  readonly animate: boolean;
  readonly onToggle: (id: string) => void;
}) {
  return (
    <Animated.View
      {...(animate ? { layout: listMotion } : {})}
      style={{
        borderRadius: 22,
        backgroundColor: inks.cell,
        boxShadow: inks.cardShadow,
        overflow: 'hidden',
      }}
    >
      {banks.map((bank, i) => (
        <Animated.View
          key={bank.id}
          {...(animate ? { entering: FadeIn.duration(160), layout: listMotion } : {})}
        >
          <BankRow
            id={bank.id}
            label={bank.shortName}
            sub={bank.name}
            on={chosen.includes(bank.id)}
            first={i === 0}
            inks={inks}
            onPress={() => onToggle(bank.id)}
          />
        </Animated.View>
      ))}
    </Animated.View>
  );
}

/**
 * Pick the banks and wallets you pay with: a search over every one 6pm knows (accents and spaces
 * never matter), a grid of quick picks (cash, what is already chosen, then suggestions for where
 * the phone is set up and is), and the full list A to Z. Onboarding and Settings both host it;
 * `scroll` keeps the search pinned over its own scrolling list, else the host scrolls it all.
 */
export function BankPicker({
  inks,
  chosen,
  onToggle,
  scroll,
}: {
  readonly inks: PickerInks;
  readonly chosen: readonly string[];
  readonly onToggle: (id: string) => void;
  readonly scroll: boolean;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  // Taken once, so tiles never move while the person is picking.
  const [picks] = useState(() => quickPicks(chosen, readDeviceRegion(), known));
  const [hadChoice] = useState(() => chosen.some((id) => id !== CASH));
  const results = useMemo(() => searchBanks(ALL_BANKS, query), [query]);
  const searching = query.trim() !== '';

  // The host answers the tap (and its haptic), as onboarding already does for its tiles.
  const toggle = onToggle;
  const label = (id: string) =>
    id === CASH ? t('onboarding.wallets.cash') : (findBank(id)?.shortName ?? id);

  const browse = (
    <Animated.View key="browse" entering={FadeIn.duration(200)} style={{ gap: 14 }}>
      <PickerLabel inks={inks} text={t(hadChoice ? 'banks.yours' : 'banks.suggested')} />
      <Grid3
        items={picks}
        gap={8}
        render={(id) => (
          <QuickTile
            id={id}
            label={label(id)}
            on={chosen.includes(id)}
            inks={inks}
            onPress={() => toggle(id)}
          />
        )}
      />
      <View style={{ height: 4 }} />
      <PickerLabel inks={inks} text={t('banks.all')} />
      <BankList banks={ALL_BANKS} chosen={chosen} inks={inks} animate={false} onToggle={toggle} />
    </Animated.View>
  );
  const found = (
    <Animated.View key="found" entering={FadeIn.duration(200)} style={{ gap: 14 }}>
      {results.length > 0 ? (
        <BankList banks={results} chosen={chosen} inks={inks} animate onToggle={toggle} />
      ) : (
        <Animated.View entering={FadeIn.duration(200)}>
          <Text
            style={{
              ...body(15),
              color: inks.inkSoft,
              textAlign: 'center',
              paddingVertical: 24,
              paddingHorizontal: 12,
            }}
          >
            {t('banks.none', { query: query.trim() })}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
  const content = searching ? found : browse;
  const search = (
    <SearchField
      inks={inks}
      value={query}
      placeholder={t('banks.search')}
      clearLabel={t('banks.clear')}
      onChange={setQuery}
    />
  );

  if (!scroll) {
    return (
      <View style={{ gap: 14 }}>
        {search}
        {content}
      </View>
    );
  }
  return <PinnedSearch search={search}>{content}</PinnedSearch>;
}

/** The search over its own list, for a host that does not scroll (onboarding). */
function PinnedSearch({
  search,
  children,
}: {
  readonly search: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <View style={{ flex: 1, minHeight: 0, gap: 12 }}>
      {search}
      {/* Bleeds to the screen's edges so card shadows are not clipped; the content keeps the inset. */}
      <ScrollView
        style={{ flex: 1, marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}
