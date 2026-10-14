import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { useI18n } from '../../../i18n/i18n';
import { Symbol } from '../../../ui/icons/symbol';
import { body } from '../../../ui/type/fonts';
import { gmailInk } from './frame-ink';
import { Magnifier } from './ios-parts';
import { TapFlash } from './moving-parts';

/** Gmail on the web, drawn in CSS pixels of a narrow desktop window (600 wide). */

export interface GmailFrameProps {
  readonly t: SharedValue<number>;
  readonly scale: number;
  /** The user's 6pm address, or words standing in for it before the server has given one. */
  readonly address: string;
}

export const FULL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

/** Gmail's top bar: menu, the M, the search box with its options button, the gear and avatar. */
export function GmailBar({
  t,
  gearAt,
  optionsAt,
  query,
}: {
  readonly t: SharedValue<number>;
  /** When the gear is clicked. */
  readonly gearAt?: number;
  /** When the search options button is clicked. */
  readonly optionsAt?: number;
  readonly query?: ReactNode;
}) {
  const { t: tr } = useI18n();
  return (
    <View
      style={{
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
      }}
    >
      <View style={{ gap: 4 }}>
        {[0, 1, 2].map((k) => (
          <View
            key={k}
            style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: gmailInk.secondary }}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Symbol name="mail" size={28} color={gmailInk.red} fill={1} />
        <Text style={{ ...body(20, 500), color: gmailInk.secondary }}>Gmail</Text>
      </View>
      <View
        style={{
          flex: 1,
          height: 44,
          borderRadius: 22,
          backgroundColor: gmailInk.search,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
        }}
      >
        <Magnifier color={gmailInk.secondary} />
        <View style={{ flex: 1 }}>
          {query ?? (
            <Text style={{ ...body(15), color: gmailInk.secondary }}>
              {tr('capture.walk.gmail.searchMail')}
            </Text>
          )}
        </View>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {optionsAt !== undefined ? <TapFlash t={t} at={optionsAt} radius={16} /> : null}
          <Symbol name="tune" size={22} color={gmailInk.secondary} />
        </View>
      </View>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {gearAt !== undefined ? <TapFlash t={t} at={gearAt} radius={18} /> : null}
        <Symbol name="settings" size={24} color={gmailInk.secondary} />
      </View>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: gmailInk.green }} />
    </View>
  );
}

/** Lines standing in for the inbox's mail. */
export function InboxLines() {
  return (
    <View
      style={{
        marginHorizontal: 14,
        borderRadius: 16,
        backgroundColor: gmailInk.surface,
        paddingVertical: 6,
      }}
    >
      {[0.7, 0.55, 0.8, 0.6, 0.75, 0.5, 0.68, 0.58].map((w, k) => (
        <View
          key={k}
          style={{
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            paddingHorizontal: 16,
            borderTopWidth: k === 0 ? 0 : 1,
            borderTopColor: gmailInk.line,
          }}
        >
          <View
            style={{
              width: 90,
              height: 9,
              borderRadius: 5,
              backgroundColor: gmailInk.secondary,
              opacity: 0.55,
            }}
          />
          <View style={{ flex: w, height: 9, borderRadius: 5, backgroundColor: gmailInk.line }} />
        </View>
      ))}
    </View>
  );
}

/** A Gmail button: blue filled, or outlined. */
export function GmailButton({
  t,
  label,
  filled = false,
  clickAt,
}: {
  readonly t: SharedValue<number>;
  readonly label: string;
  readonly filled?: boolean;
  readonly clickAt?: number;
}) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        height: 38,
        paddingHorizontal: 20,
        borderRadius: 19,
        borderWidth: filled ? 0 : 1,
        borderColor: gmailInk.line,
        backgroundColor: filled ? gmailInk.blue : gmailInk.surface,
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {clickAt !== undefined ? <TapFlash t={t} at={clickAt} radius={19} /> : null}
      <Text style={{ ...body(15, 600), color: filled ? gmailInk.surface : gmailInk.blue }}>
        {label}
      </Text>
    </View>
  );
}

/** A text field with a label above or before it. */
export function GmailField({
  children,
  width,
}: {
  readonly children?: ReactNode;
  readonly width?: number;
}) {
  return (
    <View
      style={{
        height: 40,
        width,
        flex: width === undefined ? 1 : undefined,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: gmailInk.secondary,
        justifyContent: 'center',
        paddingHorizontal: 10,
      }}
    >
      {children}
    </View>
  );
}
