import { Text, View } from 'react-native';

import { useI18n } from '../../../i18n/i18n';
import { body } from '../../../ui/type/fonts';
import { Phone } from './device';
import { iosInk } from './frame-ink';
import { Magnifier } from './ios-parts';
import { Reveal, TapFlash, Touch } from './moving-parts';
import {
  EmptyAutomation,
  LibraryScreen,
  NewShortcutScreen,
  type FrameProps,
} from './wallet-frames-library';
import { EditorBar, EditorCard } from './shortcuts-chrome';
import { TriggerCard } from './shortcuts-cards';
import { DockedDrawer, DrawerChip, DrawerItem } from './shortcuts-drawer';

const FULL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

/**
 * Library, then Automation, then its +: a new shortcut opens, and where it offers to describe one
 * the finger taps Edit.
 */
export function AutomationFrame({ t, scale }: FrameProps) {
  return (
    <Phone t={t} scale={scale} background={iosInk.grouped}>
      <Reveal t={t} from={0.24} to={0.32} out style={FULL}>
        <LibraryScreen flash={<TapFlash t={t} at={0.22} />} />
      </Reveal>
      <Reveal t={t} from={0.26} to={0.36} dx={60} style={FULL}>
        <Reveal t={t} from={0.52} to={0.6} out style={FULL}>
          <EmptyAutomation />
          <View
            style={{
              position: 'absolute',
              left: 168,
              top: 773,
              width: 67,
              height: 67,
              borderRadius: 34,
              overflow: 'hidden',
            }}
          >
            <TapFlash t={t} at={0.5} radius={34} />
          </View>
        </Reveal>
      </Reveal>
      <Reveal t={t} from={0.54} to={0.64} dy={80} style={FULL}>
        <NewShortcutScreen />
      </Reveal>
      <Touch
        t={t}
        stops={[
          { at: 0.06, x: 260, y: 600 },
          { at: 0.22, x: 280, y: 411, tap: true },
          { at: 0.5, x: 201, y: 806, tap: true },
          { at: 0.72, x: 352, y: 84, tap: true },
        ]}
      />
    </Phone>
  );
}

/** The empty editor's drawer: Automation chip, then Wallet among the triggers. */
export function WalletTriggerFrame({ t, scale }: FrameProps) {
  const { t: tr } = useI18n();
  const drawerTop = 430;
  return (
    <Phone t={t} scale={scale} background={iosInk.grouped}>
      <EditorBar name={tr('capture.walk.ios.newShortcut')} icon={false} />
      <Reveal
        t={t}
        from={0.62}
        to={0.68}
        out
        style={{ position: 'absolute', top: 154, left: 34, right: 34 }}
      >
        <Text style={{ ...body(17), color: iosInk.secondary, textAlign: 'center' }}>
          {tr('capture.walk.ios.addActions')}
        </Text>
      </Reveal>
      <Reveal t={t} from={0.64} to={0.74} dy={-20} style={FULL}>
        <EditorCard top={143}>
          <TriggerCard />
        </EditorCard>
      </Reveal>
      <Reveal t={t} from={0.6} to={0.7} out dy={420} style={FULL}>
        <View
          style={{
            position: 'absolute',
            top: drawerTop,
            left: 8,
            right: 8,
            bottom: 8,
            borderRadius: 48,
            backgroundColor: iosInk.grouped,
            boxShadow: iosInk.shadow,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 5,
              borderRadius: 3,
              backgroundColor: iosInk.tertiary,
              marginTop: 8,
            }}
          />
          <View
            style={{
              marginHorizontal: 12,
              marginTop: 10,
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
            <Text style={{ ...body(17), color: iosInk.secondary }}>
              {tr('capture.walk.ios.search')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 11, marginLeft: 12 }}>
            <DrawerChip glyph="schedule" label={tr('capture.walk.ios.automation')}>
              <TapFlash t={t} at={0.26} radius={21} />
            </DrawerChip>
            <DrawerChip glyph="code" label={tr('capture.walk.ios.scripting')} />
          </View>
          <View style={{ marginTop: 11, gap: 8 }}>
            <Reveal t={t} from={0.28} to={0.34} out style={{ gap: 8 }}>
              <DrawerItem
                glyph="chat"
                color={iosInk.green}
                name={tr('capture.walk.ios.sendMessage')}
              />
              <DrawerItem
                glyph="open_in_new"
                color={iosInk.indigo}
                name={tr('capture.walk.ios.openApp')}
              />
              <DrawerItem
                glyph="music_note"
                color={iosInk.red}
                name={tr('capture.walk.ios.playMusic')}
              />
            </Reveal>
            <Reveal
              t={t}
              from={0.3}
              to={0.38}
              dy={16}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, gap: 8 }}
            >
              <Text
                style={{ ...body(20, 700), color: iosInk.label, marginLeft: 22, marginBottom: 2 }}
              >
                {tr('capture.walk.ios.apps')}
              </Text>
              <DrawerItem
                glyph="open_in_new"
                color={iosInk.label}
                name={tr('capture.walk.ios.app')}
                example={tr('capture.walk.ios.appEx')}
              />
              <View>
                <DrawerItem
                  glyph="wallet"
                  name={tr('capture.walk.ios.wallet')}
                  example={tr('capture.walk.ios.walletEx')}
                />
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
                  <TapFlash t={t} at={0.56} />
                </View>
              </View>
              <DrawerItem
                glyph="capture"
                color={iosInk.blue}
                name={tr('capture.walk.ios.screenshot')}
                example={tr('capture.walk.ios.screenshotEx')}
              />
            </Reveal>
          </View>
        </View>
      </Reveal>
      <Reveal t={t} from={0.66} to={0.74} style={FULL}>
        <DockedDrawer />
      </Reveal>
      <Touch
        t={t}
        stops={[
          { at: 0.1, x: 250, y: 330 },
          { at: 0.26, x: 86, y: drawerTop + 79 + 21 },
          { at: 0.27, x: 86, y: drawerTop + 79 + 21, tap: true },
          { at: 0.56, x: 290, y: drawerTop + 132 + 30 + 74 + 33, tap: true },
        ]}
      />
    </Phone>
  );
}
