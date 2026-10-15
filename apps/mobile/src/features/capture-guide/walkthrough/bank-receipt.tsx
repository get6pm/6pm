import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { formatVnd } from '@6pm/domain';

import { useI18n } from '../../../i18n/i18n';
import { Symbol } from '../../../ui/icons/symbol';
import { body } from '../../../ui/type/fonts';
import { bankInk, iosInk } from './frame-ink';
import { TapFlash } from './moving-parts';

/** The receipt's transfer, as the pictured bank shows it and 6pm reads it. */
export const AMOUNT = 120000;
export const PAYEE = 'CIRCLE K';

/** A bank app's transfer receipt, with its Share button at the bottom. */
export function BankReceipt({
  t,
  flashAt,
}: {
  readonly t: SharedValue<number>;
  readonly flashAt: number;
}) {
  const { t: tr } = useI18n();
  const rows = [
    [tr('native.share.to'), PAYEE],
    [tr('capture.walk.bank.from'), 'Techcombank'],
    [tr('native.share.when'), '16:40 · 14/10'],
  ] as const;
  return (
    <View style={{ flex: 1, backgroundColor: iosInk.grouped }}>
      <View
        style={{
          height: 250,
          backgroundColor: bankInk.header,
          paddingTop: 76,
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: iosInk.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="check" size={40} color={bankInk.success} weight={700} />
        </View>
        <Text style={{ ...body(18, 600), color: iosInk.bg }}>{tr('capture.walk.bank.done')}</Text>
      </View>
      <View
        style={{
          margin: 16,
          marginTop: -30,
          borderRadius: 24,
          backgroundColor: iosInk.bg,
          padding: 20,
          gap: 14,
        }}
      >
        <Text style={{ ...body(36, 700), color: iosInk.label, textAlign: 'center' }}>
          {formatVnd(AMOUNT)}
        </Text>
        {rows.map(([k, v]) => (
          <View
            key={k}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderTopWidth: 0.6,
              borderTopColor: iosInk.separator,
              paddingTop: 13,
            }}
          >
            <Text style={{ ...body(17), color: iosInk.secondary }}>{k}</Text>
            <Text style={{ ...body(17, 600), color: iosInk.label }}>{v}</Text>
          </View>
        ))}
      </View>
      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 44,
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <View
          style={{
            flex: 1,
            height: 54,
            borderRadius: 27,
            backgroundColor: iosInk.bg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <TapFlash t={t} at={flashAt} radius={27} />
          <Symbol name="ios_share" size={24} color={bankInk.header} />
          <Text style={{ ...body(17, 600), color: bankInk.header }}>
            {tr('capture.walk.bank.share')}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            height: 54,
            borderRadius: 27,
            backgroundColor: bankInk.header,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(17, 600), color: iosInk.bg }}>{tr('capture.walk.bank.home')}</Text>
        </View>
      </View>
    </View>
  );
}
