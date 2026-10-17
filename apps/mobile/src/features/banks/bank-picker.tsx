import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { BANKS, banksOf, findBank, WORLD_BANKS, type BankInfo } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { useHomeCurrency } from '../../money/use-money-format';
import { body } from '../../ui/type/fonts';
import { Grid } from '../onboarding/step-parts';
import { BankRow, PickerLabel, QuickTile, SearchField, type PickerInks } from './bank-picker-parts';
import { bankCountry, banksInVietnam, CASH, quickPicks, type DeviceRegion } from './bank-ranking';
import { searchBanks } from './bank-search';
import { readDeviceRegion } from './device-region';
import { bankNameOf, namedBankId, tidyBankName } from './named-bank';

const known = (id: string) => findBank(id) !== null;

/** A to Z by the name people use. */
const byName = (banks: readonly BankInfo[]): BankInfo[] =>
  [...banks].sort((a, b) => a.shortName.localeCompare(b.shortName, 'vi', { sensitivity: 'base' }));

/** Vietnam's banks and wallets, A to Z. */
const VIETNAM_BANKS = byName(BANKS);
/** Every bank and wallet 6pm knows, for search. */
const EVERY_BANK = byName([...BANKS, ...WORLD_BANKS]);

/** The full list to browse: Vietnam's in Vietnam, else the phone's country's; null with none. */
function browseList(device: DeviceRegion, home: string): readonly BankInfo[] | null {
  if (banksInVietnam(device, home)) return VIETNAM_BANKS;
  const country = bankCountry(device);
  return country === null ? null : byName(banksOf(country));
}

const listMotion = LinearTransition.duration(220);

const cardStyle = (inks: PickerInks) =>
  ({
    borderRadius: 22,
    backgroundColor: inks.cell,
    boxShadow: inks.cardShadow,
    overflow: 'hidden',
  }) as const;

/** The name being searched for, as a bank of the person's own: tick it to add it by name. */
function NamedRow({
  query,
  chosen,
  inks,
  onToggle,
}: {
  readonly query: string;
  readonly chosen: readonly string[];
  readonly inks: PickerInks;
  readonly onToggle: (id: string) => void;
}) {
  const { t } = useI18n();
  const id = namedBankId(query);
  if (id === null) return null;
  return (
    <Animated.View entering={FadeIn.duration(160)} layout={listMotion} style={cardStyle(inks)}>
      <BankRow
        id={id}
        label={tidyBankName(query)}
        sub={t('banks.byName')}
        on={chosen.includes(id)}
        first
        inks={inks}
        onPress={() => onToggle(id)}
      />
    </Animated.View>
  );
}

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
  const { t } = useI18n();
  // The registered name, or what it is when that only says the name again ("Venmo").
  const subOf = (bank: BankInfo) =>
    bank.name !== bank.shortName ? bank.name : t(`banks.kind.${bank.kind}`);
  return (
    <Animated.View {...(animate ? { layout: listMotion } : {})} style={cardStyle(inks)}>
      {banks.map((bank, i) => (
        <Animated.View
          key={bank.id}
          {...(animate ? { entering: FadeIn.duration(160), layout: listMotion } : {})}
        >
          <BankRow
            id={bank.id}
            label={bank.shortName}
            sub={subOf(bank)}
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
 * the phone is set up and is), and the full list A to Z: Vietnam's in Vietnam, else the main
 * banks and wallets of the country the phone points at. Where 6pm has no list there are no
 * suggestions: cash and the person's own. Outside Vietnam a bank missing from the list is added by
 * typing its name. Onboarding and Settings both host it; `scroll` keeps the
 * search pinned over its own scrolling list, else the host scrolls it all.
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
  const home = useHomeCurrency().code;
  const [query, setQuery] = useState('');
  // Taken once, so tiles never move while the person is picking.
  const [local] = useState(() => banksInVietnam(readDeviceRegion(), home));
  const [list] = useState(() => browseList(readDeviceRegion(), home));
  const [picks] = useState(() => quickPicks(chosen, readDeviceRegion(), known, home));
  const [hadChoice] = useState(() => chosen.some((id) => id !== CASH));
  // With no full list to find them in again, banks added from a search join the grid's end.
  const [added, setAdded] = useState<readonly string[]>([]);
  // In Vietnam, Vietnam's; elsewhere every bank, the country's own first.
  const results = useMemo(() => {
    if (local) return searchBanks(VIETNAM_BANKS, query);
    const found = searchBanks(EVERY_BANK, query);
    const own = new Set(list?.map((b) => b.id));
    return [...found.filter((b) => own.has(b.id)), ...found.filter((b) => !own.has(b.id))];
  }, [query, local, list]);
  const searching = query.trim() !== '';
  const tiles = [...picks, ...added];
  const typed = tidyBankName(query).toLocaleLowerCase();
  const offerName =
    !local && typed !== '' && !results.some((b) => b.shortName.toLocaleLowerCase() === typed);

  // The host answers the tap (and its haptic), as onboarding already does for its tiles.
  const toggle = (id: string) => {
    if (list === null && !tiles.includes(id)) setAdded((more) => [...more, id]);
    onToggle(id);
  };
  const label = (id: string) =>
    id === CASH ? t('onboarding.wallets.cash') : (bankNameOf(id) ?? findBank(id)?.shortName ?? id);

  const browse = (
    <Animated.View key="browse" entering={FadeIn.duration(200)} style={{ gap: 14 }}>
      <PickerLabel
        inks={inks}
        text={t(list === null ? 'banks.yoursOnly' : hadChoice ? 'banks.yours' : 'banks.suggested')}
      />
      <Grid
        items={tiles}
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
      {list !== null ? (
        <>
          <View style={{ height: 4 }} />
          <PickerLabel inks={inks} text={t('banks.all')} />
          <BankList banks={list} chosen={chosen} inks={inks} animate={false} onToggle={toggle} />
        </>
      ) : (
        <Text style={{ ...body(15), color: inks.inkSoft, paddingHorizontal: 6 }}>
          {t('banks.typeHint')}
        </Text>
      )}
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
      {offerName ? <NamedRow query={query} chosen={chosen} inks={inks} onToggle={toggle} /> : null}
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
