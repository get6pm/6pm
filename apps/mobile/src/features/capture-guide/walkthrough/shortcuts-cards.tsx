import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { useI18n } from '../../../i18n/i18n';
import { body } from '../../../ui/type/fonts';
import { WALLET_SHORTCUT_NAME } from '../wallet-shortcut';
import { iosInk } from './frame-ink';
import { Reveal, Switch } from './moving-parts';
import { ActionGlyph, RemoveMark } from './shortcuts-chrome';

/** The cards of the Shortcuts editor: the Wallet trigger and "Run Shortcut" set to the 6pm one. */

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
function FieldRow({ label, children }: { readonly label: string; readonly children?: ReactNode }) {
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

/** A parameter inside an action's sentence: blue on a pale blue tint, faint while unset. */
function Token({ text, unset = false }: { readonly text: string; readonly unset?: boolean }) {
  return (
    <View
      style={{
        height: 30,
        paddingHorizontal: 6,
        borderRadius: 7,
        backgroundColor: iosInk.tokenBg,
        justifyContent: 'center',
      }}
    >
      <Text
        numberOfLines={1}
        style={{ ...body(20, 600), color: iosInk.blue, opacity: unset ? 0.55 : 1 }}
      >
        {text}
      </Text>
    </View>
  );
}

/**
 * "Run Shortcut" as the editor shows it: Run, the shortcut it runs and Show When Run. Unset until
 * `pickAt`, then "Log to 6pm"; Show When Run turns off at `showOffAt`.
 */
export function RunShortcutCard({
  t,
  pickAt,
  showOffAt,
}: {
  readonly t: SharedValue<number>;
  /** When the 6pm shortcut is picked; it is set from the start when undefined. */
  readonly pickAt?: number;
  /** When Show When Run turns off; it stays on when undefined. */
  readonly showOffAt?: number;
}) {
  const { t: tr } = useI18n();
  const picked = pickAt ?? -1;
  return (
    <View>
      <View
        style={{
          padding: 16,
          paddingRight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <ActionGlyph glyph="layers" />
        <Text style={{ ...body(20, 600), color: iosInk.label }}>{tr('capture.walk.ios.run')}</Text>
        <View
          style={{ width: 160, height: 30, justifyContent: 'center', alignItems: 'flex-start' }}
        >
          {pickAt !== undefined ? (
            <Reveal t={t} from={pickAt} to={pickAt + 0.04} out>
              <Token text={tr('capture.walk.ios.shortcut')} unset />
            </Reveal>
          ) : null}
          <Reveal
            t={t}
            from={picked}
            to={picked + 0.06}
            fromScale={0.85}
            style={{ position: 'absolute', left: 0 }}
          >
            <Token text={WALLET_SHORTCUT_NAME} />
          </Reveal>
        </View>
      </View>
      <RemoveMark />
      <FieldRow label={tr('capture.walk.ios.showWhenRun')}>
        <Switch t={t} from={showOffAt ?? 2} to={(showOffAt ?? 2) + 0.06} startsOn />
      </FieldRow>
    </View>
  );
}
