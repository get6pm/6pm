import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { useI18n } from '../../../i18n/i18n';
import { Symbol } from '../../../ui/icons/symbol';
import type { SymbolName } from '../../../ui/icons/symbols.generated';
import { body } from '../../../ui/type/fonts';
import { iosInk } from './frame-ink';
import { GlassButton, LargeTitle } from './ios-parts';
import { SixPmIcon } from './shortcuts-chrome';

const FULL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

export interface FrameProps {
  readonly t: SharedValue<number>;
  readonly scale: number;
}

/** The round + at the bottom of a Shortcuts list. */
export function AddButton() {
  return (
    <View style={{ position: 'absolute', left: 168, top: 773 }}>
      <View
        style={{
          width: 67,
          height: 67,
          borderRadius: 34,
          backgroundColor: iosInk.bg,
          boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name="add" size={34} color={iosInk.label} />
      </View>
    </View>
  );
}

/** Automation, empty: the sparkle, "No Automations" and the + at the bottom. */
export function EmptyAutomation() {
  const { t } = useI18n();
  return (
    <View style={FULL}>
      <LargeTitle
        title={t('capture.walk.ios.automation')}
        left={<GlassButton glyph="chevron_left" />}
        right={<GlassButton glyph="sort" />}
      />
      <View
        style={{
          position: 'absolute',
          top: 430,
          left: 30,
          right: 30,
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Symbol name="auto_awesome" size={40} color={iosInk.secondary} fill={1} />
        <Text style={{ ...body(17, 600), color: iosInk.label, marginTop: 8 }}>
          {t('capture.walk.ios.noAutomations')}
        </Text>
        <Text style={{ ...body(17), color: iosInk.secondary, textAlign: 'center' }}>
          {t('capture.walk.ios.noAutomationsSub')}
        </Text>
      </View>
      <AddButton />
    </View>
  );
}

/** Library: the folders, Automation among them, and 6pm under Apps. `flash` marks Automation. */
export function LibraryScreen({ flash }: { readonly flash?: ReactNode }) {
  const { t } = useI18n();
  const rows: readonly { label: string; glyph: SymbolName }[] = [
    { label: t('capture.walk.ios.allShortcuts'), glyph: 'stack' },
    { label: t('capture.walk.ios.shareSheet'), glyph: 'ios_share' },
    { label: 'Apple Watch', glyph: 'watch' },
    { label: t('capture.walk.ios.gallery'), glyph: 'apps' },
    { label: t('capture.walk.ios.automation'), glyph: 'schedule' },
  ];
  return (
    <View style={FULL}>
      <LargeTitle
        title={t('capture.walk.ios.library')}
        right={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <GlassButton text={t('capture.walk.ios.edit')} />
            <GlassButton glyph="add_box" />
          </View>
        }
      />
      <View
        style={{
          marginTop: 10,
          marginHorizontal: 16,
          borderRadius: 26,
          backgroundColor: iosInk.bg,
          overflow: 'hidden',
        }}
      >
        {rows.map((row, k) => (
          <View
            key={row.glyph}
            style={{ height: 54, flexDirection: 'row', alignItems: 'center', paddingLeft: 16 }}
          >
            {k === rows.length - 1 ? flash : null}
            <Symbol name={row.glyph} size={24} color={iosInk.blue} />
            <View
              style={{
                flex: 1,
                height: 54,
                marginLeft: 14,
                paddingRight: 14,
                flexDirection: 'row',
                alignItems: 'center',
                borderTopWidth: k === 0 ? 0 : 0.6,
                borderTopColor: iosInk.separator,
              }}
            >
              <Text style={{ flex: 1, ...body(17), color: iosInk.label }}>{row.label}</Text>
              <Symbol name="chevron_right" size={22} color={iosInk.tertiary} />
            </View>
          </View>
        ))}
      </View>
      <Text style={{ ...body(22, 700), color: iosInk.label, marginTop: 26, marginLeft: 32 }}>
        {t('capture.walk.ios.apps')}
      </Text>
      <View
        style={{
          marginTop: 10,
          marginHorizontal: 16,
          height: 60,
          borderRadius: 26,
          backgroundColor: iosInk.bg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 14,
        }}
      >
        <SixPmIcon size={32} />
        <Text style={{ flex: 1, ...body(17), color: iosInk.label }}>6pm</Text>
        <Symbol name="chevron_right" size={22} color={iosInk.tertiary} />
      </View>
    </View>
  );
}

/** A new shortcut, offering to describe one, with Edit at the top right. */
export function NewShortcutScreen() {
  const { t } = useI18n();
  return (
    <View style={FULL}>
      <View
        style={{
          position: 'absolute',
          top: 62,
          left: 16,
          right: 16,
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <GlassButton glyph="chevron_left" />
        <Text style={{ ...body(17, 600), color: iosInk.label }}>
          {t('capture.walk.ios.newShortcut')}
        </Text>
        <GlassButton text={t('capture.walk.ios.edit')} />
      </View>
      <View
        style={{
          position: 'absolute',
          top: 150,
          left: 34,
          right: 34,
          height: 236,
          borderRadius: 48,
          backgroundColor: iosInk.bg,
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 30,
        }}
      >
        <Symbol name="auto_awesome" size={44} color={iosInk.blue} />
        <Text style={{ ...body(20, 600), color: iosInk.label, textAlign: 'center', marginTop: 12 }}>
          {t('capture.walk.ios.describe')}
        </Text>
      </View>
      <View
        style={{
          position: 'absolute',
          left: 32,
          right: 32,
          bottom: 36,
          height: 50,
          borderRadius: 25,
          backgroundColor: iosInk.bg,
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          justifyContent: 'center',
          paddingHorizontal: 18,
        }}
      >
        <Text style={{ ...body(17), color: iosInk.tertiary }}>
          {t('capture.walk.ios.describe')}
        </Text>
      </View>
    </View>
  );
}
