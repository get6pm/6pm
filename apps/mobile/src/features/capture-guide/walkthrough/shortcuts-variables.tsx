import { Text, View } from 'react-native';

import { useI18n } from '../../../i18n/i18n';
import { Symbol } from '../../../ui/icons/symbol';
import { body } from '../../../ui/type/fonts';
import { iosInk } from './frame-ink';
import { TapFlash } from './moving-parts';
import type { FrameProps } from './wallet-frames-library';

/** What the editor shows while a field is being filled: keyboard, variables bar, variable sheet. */

export const SHEET_TOP = 415;

/** A plain keyboard: three rows of blank keys and the space bar, as the drawn screens need one. */
export function Keyboard() {
  const row = (n: number, inset: number) => (
    <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: inset }}>
      {Array.from({ length: n }, (_, k) => (
        <View
          key={k}
          style={{ flex: 1, height: 44, borderRadius: 8, backgroundColor: iosInk.bg }}
        />
      ))}
    </View>
  );
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 300,
        backgroundColor: '#D5D7DD',
        paddingTop: 10,
        gap: 11,
        paddingHorizontal: 4,
      }}
    >
      {row(10, 0)}
      {row(9, 18)}
      {row(7, 50)}
      <View
        style={{ marginHorizontal: 100, height: 44, borderRadius: 8, backgroundColor: iosInk.bg }}
      />
    </View>
  );
}

/** The variables bar above the keyboard: Shortcut Input and Transaction. */
export function VariablesBar({
  t: clock,
  flashAt,
}: {
  readonly t: FrameProps['t'];
  readonly flashAt: number;
}) {
  const { t } = useI18n();
  return (
    <View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        top: 800,
        height: 46,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {[t('capture.walk.ios.shortcutInput'), t('capture.walk.ios.transaction')].map((label, k) => (
        <View
          key={label}
          style={{
            height: 44,
            paddingHorizontal: 14,
            borderRadius: 22,
            backgroundColor: iosInk.bg,
            boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            overflow: 'hidden',
          }}
        >
          <Symbol name={k === 0 ? 'stack' : 'credit_card'} size={20} color={iosInk.label} />
          <Text style={{ ...body(16, 500), color: iosInk.label }}>{label}</Text>
          {k === 1 ? <TapFlash t={clock} at={flashAt} /> : null}
        </View>
      ))}
    </View>
  );
}

/** The sheet a tapped variable opens: Clear Variable, Return, and the parts to Get. */
export function VariableSheet({
  t: clock,
  picked,
}: {
  readonly t: FrameProps['t'];
  readonly picked: 'amount' | 'merchant';
}) {
  const { t } = useI18n();
  const parts = [
    ['transaction', t('capture.walk.ios.transaction')],
    ['card', t('capture.walk.ios.cardOrPass')],
    ['merchant', t('capture.walk.ios.merchant')],
    ['amount', t('capture.walk.ios.amount')],
    ['name', t('capture.walk.ios.name')],
  ] as const;
  return (
    <View
      style={{
        position: 'absolute',
        top: SHEET_TOP,
        left: 8,
        right: 8,
        bottom: 8,
        borderRadius: 44,
        backgroundColor: iosInk.grouped,
        boxShadow: iosInk.shadow,
        padding: 15,
        paddingTop: 22,
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 6 }}>
        <Symbol name="credit_card" size={22} color={iosInk.label} />
        <Text style={{ ...body(20, 700), color: iosInk.label }}>
          {t('capture.walk.ios.transaction')}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
        {[t('capture.walk.ios.clearVariable'), t('capture.walk.ios.return')].map((label, k) => (
          <View
            key={label}
            style={{
              flex: 1,
              height: 66,
              borderRadius: 18,
              backgroundColor: iosInk.fill,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <Symbol name={k === 0 ? 'backspace' : 'keyboard'} size={20} color={iosInk.label} />
            <Text style={{ ...body(13, 500), color: iosInk.label }}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={{ ...body(17, 600), color: iosInk.secondary, marginTop: 30, marginLeft: 10 }}>
        {t('capture.walk.ios.get')}
      </Text>
      <View style={{ marginTop: 12, borderRadius: 22, backgroundColor: iosInk.bg }}>
        {parts.map(([id, label], k) => (
          <View
            key={id}
            style={{
              height: 52,
              marginLeft: 16,
              paddingRight: 16,
              flexDirection: 'row',
              alignItems: 'center',
              borderTopWidth: k === 0 ? 0 : 0.6,
              borderTopColor: iosInk.separator,
            }}
          >
            <Text style={{ flex: 1, ...body(17), color: iosInk.label }}>{label}</Text>
            {id === 'transaction' ? (
              <Symbol name="check" size={22} color={iosInk.blue} weight={600} />
            ) : null}
            {id === picked ? <TapFlash t={clock} at={0.6} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}
