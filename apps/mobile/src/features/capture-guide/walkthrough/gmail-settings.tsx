import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { useI18n } from '../../../i18n/i18n';
import { Symbol } from '../../../ui/icons/symbol';
import { body } from '../../../ui/type/fonts';
import { gmailInk } from './frame-ink';
import { FULL } from './gmail-parts';
import { Reveal, TapFlash } from './moving-parts';

/** A checkbox that ticks at `at` (or stays as it is without one). */
export function GmailCheck({
  t,
  label,
  at,
  children,
}: {
  readonly t: SharedValue<number>;
  readonly label: string;
  readonly at?: number;
  readonly children?: ReactNode;
}) {
  return (
    <View style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 3,
          borderWidth: 2,
          borderColor: gmailInk.secondary,
          overflow: 'hidden',
        }}
      >
        {at !== undefined ? (
          <Reveal
            t={t}
            from={at}
            to={at + 0.04}
            style={{
              ...FULL,
              backgroundColor: gmailInk.blue,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Symbol name="check" size={16} color={gmailInk.surface} weight={700} />
          </Reveal>
        ) : null}
      </View>
      <Text style={{ ...body(15), color: gmailInk.label }}>{label}</Text>
      {children}
    </View>
  );
}

/** The settings page's heading and its tabs, Forwarding and POP/IMAP underlined from `at`. */
export function SettingsTabs({ t, at }: { readonly t: SharedValue<number>; readonly at: number }) {
  const { t: tr } = useI18n();
  const tabs = [
    tr('capture.walk.gmail.general'),
    tr('capture.walk.gmail.labels'),
    tr('capture.walk.gmail.inbox'),
    tr('capture.walk.gmail.filters'),
  ];
  return (
    <View
      style={{
        marginHorizontal: 14,
        borderRadius: 16,
        backgroundColor: gmailInk.surface,
        padding: 18,
        paddingBottom: 0,
      }}
    >
      <Text style={{ ...body(22, 500), color: gmailInk.label }}>
        {tr('capture.walk.gmail.settings')}
      </Text>
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 22, rowGap: 4, marginTop: 14 }}
      >
        {tabs.map((tab, k) => (
          <View key={tab} style={{ height: 38, justifyContent: 'center' }}>
            <Text style={{ ...body(14, k === 0 ? 600 : 400), color: gmailInk.secondary }}>
              {tab}
            </Text>
            {k === 0 ? (
              <Reveal
                t={t}
                from={at}
                to={at + 0.05}
                out
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: gmailInk.secondary,
                }}
              />
            ) : null}
          </View>
        ))}
        <View style={{ height: 38, justifyContent: 'center', overflow: 'hidden' }}>
          <TapFlash t={t} at={at} />
          <Text style={{ ...body(14, 600), color: gmailInk.label }}>
            {tr('capture.walk.gmail.forwarding')}
          </Text>
          <Reveal
            t={t}
            from={at}
            to={at + 0.05}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: gmailInk.red,
            }}
          />
        </View>
      </View>
    </View>
  );
}
