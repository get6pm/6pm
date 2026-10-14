import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { useI18n } from '../../../i18n/i18n';
import { Symbol } from '../../../ui/icons/symbol';
import { body } from '../../../ui/type/fonts';
import { iosInk } from './frame-ink';
import { Reveal, Switch } from './moving-parts';
import { ActionGlyph, RemoveMark, SixPmIcon } from './shortcuts-chrome';

/** The cards of the Shortcuts editor: the Wallet trigger and "Log in 6pm" with its fields. */

/** "When Any Card is tapped", the Wallet trigger at the top of the shortcut. */
export function TriggerCard() {
  const { t } = useI18n();
  return (
    <View>
      <View style={{ padding: 16, paddingRight: 48, flexDirection: 'row', gap: 12 }}>
        <ActionGlyph glyph="wallet" />
        <Text style={{ flex: 1, ...body(20, 600), lineHeight: 30, color: iosInk.label }}>
          {`${t('capture.walk.ios.when')} `}
          <Text style={{ color: iosInk.blue, backgroundColor: iosInk.tokenBg }}>
            {` ${t('capture.walk.ios.anyCard')} `}
          </Text>
          {` ${t('capture.walk.ios.isTapped')}`}
        </Text>
      </View>
      <RemoveMark />
    </View>
  );
}

/** A labelled row of a card, with whatever sits on its right. */
export function FieldRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children?: ReactNode;
}) {
  return (
    <View
      style={{
        height: 44,
        marginLeft: 16,
        paddingRight: 16,
        borderTopWidth: 0.6,
        borderTopColor: iosInk.separator,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <Text style={{ ...body(17), color: iosInk.label }}>{label}</Text>
      <View style={{ flexShrink: 1, alignItems: 'flex-end' }}>{children}</View>
    </View>
  );
}

/** The variable in a field: a pale blue pill with the card glyph and the picked part's name. */
export function VariableToken({ name }: { readonly name: string }) {
  return (
    <View
      style={{
        height: 26,
        paddingHorizontal: 7,
        borderRadius: 7,
        backgroundColor: iosInk.tokenBg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <Symbol name="credit_card" size={16} color={iosInk.blue} />
      <Text numberOfLines={1} style={{ ...body(14, 600), color: iosInk.blue }}>
        {name}
      </Text>
    </View>
  );
}

/** A field of "Log in 6pm": its placeholder, and the token that replaces it. */
export interface FieldState {
  /** The token's name once filled; null keeps the placeholder. */
  readonly token: string | null;
  /** When the token appears (it stays from the start when undefined). */
  readonly at?: number;
  /** The token's name before it is picked, shown from `at` until `pickAt`. */
  readonly first?: string;
  readonly pickAt?: number;
}

function Field({
  t,
  label,
  state,
}: {
  readonly t: SharedValue<number>;
  readonly label: string;
  readonly state: FieldState;
}) {
  const placeholder = <Text style={{ ...body(17), color: iosInk.tertiary }}>{label}</Text>;
  if (state.token === null) return <FieldRow label={label}>{placeholder}</FieldRow>;
  const at = state.at ?? -1;
  const pickAt = state.pickAt ?? at;
  return (
    <FieldRow label={label}>
      <View style={{ height: 26, minWidth: 190, justifyContent: 'center', alignItems: 'flex-end' }}>
        <Reveal t={t} from={at} to={at + 0.04} out>
          {placeholder}
        </Reveal>
        {state.first ? (
          <Reveal t={t} from={at} to={at + 0.05} style={{ position: 'absolute', right: 0 }}>
            <Reveal t={t} from={pickAt} to={pickAt + 0.04} out>
              <VariableToken name={state.first} />
            </Reveal>
          </Reveal>
        ) : null}
        <Reveal
          t={t}
          from={pickAt}
          to={pickAt + 0.06}
          fromScale={0.85}
          style={{ position: 'absolute', right: 0 }}
        >
          <VariableToken name={state.token} />
        </Reveal>
      </View>
    </FieldRow>
  );
}

/** "Log in 6pm" with Amount, Where and Show When Run, each animating to the state it is given. */
export function LogSpendCard({
  t,
  amount = { token: null },
  where = { token: null },
  showOffAt,
}: {
  readonly t: SharedValue<number>;
  readonly amount?: FieldState;
  readonly where?: FieldState;
  /** When Show When Run turns off; it stays on when undefined. */
  readonly showOffAt?: number;
}) {
  const { t: tr } = useI18n();
  return (
    <View>
      <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <SixPmIcon size={26} />
        <Text style={{ ...body(20, 600), color: iosInk.label }}>
          {tr('native.intents.logSpend.title')}
        </Text>
      </View>
      <RemoveMark />
      <Field t={t} label={tr('native.intents.logSpend.amount')} state={amount} />
      <Field t={t} label={tr('native.intents.logSpend.merchant')} state={where} />
      <FieldRow label={tr('capture.walk.ios.showWhenRun')}>
        <Switch t={t} from={showOffAt ?? 2} to={(showOffAt ?? 2) + 0.06} startsOn />
      </FieldRow>
    </View>
  );
}
