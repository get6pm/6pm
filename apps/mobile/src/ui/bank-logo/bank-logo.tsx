import { Image, StyleSheet, Text, View } from 'react-native';

import { findBank, type BankInfo } from '@6pm/domain';

import { bankNameOf } from '../../features/banks/named-bank';
import { useHomeCurrency } from '../../money/use-money-format';
import { body } from '../type/fonts';
import { symbolStyle } from '../type/symbol-face';
import { BANK_LOGOS } from './bank-logos';

/** The wallet code for money that never touches a bank. */
const CASH = 'CASH';
/** Cash's tile, as the onboarding prototype tints it. */
const CASH_TINT = '#b8895a';
/** Letters on a brand-coloured monogram: every brand colour here is deep enough for white. */
const ON_TINT = '#ffffff';

/**
 * The letters a bank without a logo is drawn with: a short code as is, else its name's start (the
 * name typed for a bank 6pm does not know). Cash is the home currency's symbol.
 */
function monogram(bank: BankInfo | null, id: string, cashSymbol: string): string {
  if (id === CASH) return cashSymbol;
  const typed = bankNameOf(id);
  if (typed !== null) return typed.slice(0, 2);
  const code = bank?.id ?? id;
  if (code.length <= 4 && /^[A-Z]+$/.test(code)) return code;
  return (bank?.shortName ?? code).slice(0, 2);
}

/**
 * A bank or wallet's logo as a rounded square: its bundled logo, or a monogram on the bank's
 * colour when 6pm has none. Cash draws the home currency's sign (₫, $) on its own tint.
 */
export function BankLogo({
  id,
  size,
  radius = size * 0.3,
  neutral,
  neutralInk,
  edge,
}: {
  /** The bank's VietQR code ("MB"), or "CASH". */
  readonly id: string;
  readonly size: number;
  readonly radius?: number;
  /** The monogram's tile when the bank has no colour of its own. */
  readonly neutral: string;
  /** Letters on that neutral tile. */
  readonly neutralInk: string;
  /** A hairline around a logo, so a white one holds its shape on a white card. */
  readonly edge?: string;
}) {
  const cashSymbol = useHomeCurrency().symbol;
  const bank = id === CASH ? null : findBank(id);
  const logo = bank ? BANK_LOGOS[bank.id] : undefined;
  const frame = { width: size, height: size, borderRadius: radius, overflow: 'hidden' } as const;
  if (logo !== undefined) {
    return (
      <View style={frame}>
        <Image
          source={logo}
          accessibilityIgnoresInvertColors
          style={{ width: size, height: size }}
        />
        {edge ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: radius, borderWidth: StyleSheet.hairlineWidth, borderColor: edge },
            ]}
          />
        ) : null}
      </View>
    );
  }
  const letters = monogram(bank, id, cashSymbol);
  const own = id === CASH ? CASH_TINT : (bank?.color ?? null);
  return (
    <View
      style={[
        frame,
        { backgroundColor: own ?? neutral, alignItems: 'center', justifyContent: 'center' },
      ]}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{
          ...symbolStyle(
            body(Math.round(size * (letters.length > 3 ? 0.28 : 0.36)), 800, -0.02),
            letters,
          ),
          color: own === null ? neutralInk : ON_TINT,
        }}
      >
        {letters}
      </Text>
    </View>
  );
}
