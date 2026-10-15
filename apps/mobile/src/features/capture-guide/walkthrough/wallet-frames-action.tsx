import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useI18n } from '../../../i18n/i18n';
import { Symbol } from '../../../ui/icons/symbol';
import { body } from '../../../ui/type/fonts';
import { WALLET_SHORTCUT_NAME } from '../wallet-shortcut';
import { Phone } from './device';
import { iosInk } from './frame-ink';
import { GlyphTile, Magnifier } from './ios-parts';
import { Reveal, TapFlash, Touch, Typed } from './moving-parts';
import { RunShortcutCard, TriggerCard } from './shortcuts-cards';
import { ActionGlyph, EditorBar, EditorCard, LogShortcutIcon } from './shortcuts-chrome';
import { DockedDrawer, DrawerItem, Keyboard, SHEET_TOP } from './shortcuts-drawer';
import type { FrameProps } from './wallet-frames-library';

const FULL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

/** Where "Run Shortcut" sits under the trigger. */
const CARD_TOP = 251;

/** The Shortcut parameter's centre, where the finger taps to pick one. */
const TOKEN = { x: 168, y: CARD_TOP + 31 } as const;

/** The picker's rows: the 6pm shortcut among the user's others, as Shortcuts lists them. */
const PICK_TOP = SHEET_TOP + 22 + 44 + 14;

const PICK_ROW = 52;

const PICK_Y = PICK_TOP + PICK_ROW * 2 + PICK_ROW / 2;

/** A tapped row's flash, clipped to the row's rounded shape. */
function RowFlash({ children }: { readonly children: ReactNode }) {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 12,
        right: 12,
        borderRadius: 22,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

/** The sheet the Shortcut parameter opens: search, then the user's shortcuts with 6pm's. */
function ShortcutPicker({ t }: FrameProps) {
  const { t: tr } = useI18n();
  const rows = [
    {
      name: tr('capture.walk.ios.shortcutA'),
      icon: <GlyphTile glyph="home" color={iosInk.teal} />,
    },
    {
      name: tr('capture.walk.ios.shortcutB'),
      icon: <GlyphTile glyph="local_laundry_service" color={iosInk.purple} />,
    },
    { name: WALLET_SHORTCUT_NAME, icon: <LogShortcutIcon /> },
  ];
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
        paddingTop: 22,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          marginHorizontal: 16,
          height: 44,
          borderRadius: 22,
          backgroundColor: iosInk.fill,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 14,
        }}
      >
        <Magnifier color={iosInk.secondary} />
        <Text style={{ ...body(17), color: iosInk.secondary }}>
          {tr('capture.walk.ios.search')}
        </Text>
      </View>
      <View
        style={{
          marginTop: 14,
          marginHorizontal: 16,
          borderRadius: 22,
          backgroundColor: iosInk.bg,
          overflow: 'hidden',
        }}
      >
        {rows.map((row, k) => (
          <View
            key={row.name}
            style={{
              height: PICK_ROW,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              borderTopWidth: k === 0 ? 0 : 0.6,
              borderTopColor: iosInk.separator,
            }}
          >
            {k === rows.length - 1 ? <TapFlash t={t} at={0.72} /> : null}
            {row.icon}
            <Text style={{ flex: 1, ...body(17), color: iosInk.label }}>{row.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** The search finds "Run Shortcut"; under the trigger, its Shortcut is set to the 6pm one. */
export function RunShortcutFrame({ t, scale }: FrameProps) {
  const { t: tr } = useI18n();
  const name = tr('capture.walk.ios.runShortcut');
  return (
    <Phone t={t} scale={scale} background={iosInk.grouped}>
      <EditorBar name={tr('capture.walk.ios.newShortcut')} icon={false} />
      <EditorCard top={143}>
        <TriggerCard />
      </EditorCard>
      <Reveal t={t} from={0.44} to={0.52} dy={-16} style={FULL}>
        <EditorCard top={CARD_TOP}>
          <RunShortcutCard t={t} pickAt={0.74} />
        </EditorCard>
      </Reveal>
      <Reveal t={t} from={0.1} to={0.16} out style={FULL}>
        <DockedDrawer />
      </Reveal>
      <Reveal t={t} from={0.12} to={0.2} style={FULL}>
        <Reveal t={t} from={0.42} to={0.5} out dy={300} style={FULL}>
          <View
            style={{
              position: 'absolute',
              top: 70,
              left: 0,
              right: 0,
              bottom: 0,
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              backgroundColor: iosInk.grouped,
              boxShadow: iosInk.shadow,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                margin: 16,
                marginTop: 10,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: iosInk.fill,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 14,
                }}
              >
                <Magnifier color={iosInk.label} />
                <Typed
                  t={t}
                  from={0.2}
                  to={0.32}
                  text={name}
                  width={150}
                  style={{ ...body(17), color: iosInk.label }}
                />
              </View>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: iosInk.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Symbol name="close" size={22} color={iosInk.label} />
              </View>
            </View>
            <Reveal t={t} from={0.32} to={0.38}>
              <View>
                <DrawerItem name={name} icon={<ActionGlyph glyph="layers" />} />
                <RowFlash>
                  <TapFlash t={t} at={0.4} />
                </RowFlash>
              </View>
            </Reveal>
            <Keyboard />
          </View>
        </Reveal>
      </Reveal>
      <Reveal t={t} from={0.6} to={0.66} dy={460} style={FULL}>
        <Reveal t={t} from={0.74} to={0.8} out dy={460} style={FULL}>
          <ShortcutPicker t={t} scale={scale} />
        </Reveal>
      </Reveal>
      <Touch
        t={t}
        stops={[
          { at: 0.04, x: 280, y: 560 },
          { at: 0.1, x: 180, y: 818, tap: true },
          { at: 0.4, x: 270, y: 166, tap: true },
          { at: 0.58, x: TOKEN.x, y: TOKEN.y, tap: true },
          { at: 0.72, x: 200, y: PICK_Y, tap: true },
        ]}
      />
    </Phone>
  );
}
