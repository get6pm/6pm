import { useRouter } from 'expo-router';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { curves } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { Symbol } from '../../ui/icons/symbol';
import { SheetFrame } from '../../ui/navigation/sheet-frame';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading } from '../../ui/type/fonts';
import { ActionStage } from './action-stage';
import { ControlStage } from './control-stage';
import { HomeStage } from './home-stage';
import { LiveStage } from './live-stage';
import { LockStage } from './lock-stage';
import { useWidgetPreview } from './preview-data';
import { SurfaceCard } from './surface-card';

/** The prototype's `screenIn`: up 12 pt from 98.5 %, over 0.35 s on the entrance curve. */
const screenIn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 12 }, { scale: 0.985 }] },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
    easing: Easing.bezier(...curves.enter),
  },
}).duration(350);

/**
 * Widgets & controls: every place 6pm lives outside the app (the Home Screen and Lock Screen
 * widgets, the Control Center controls, the Action button and the Live Activity), each drawn as
 * it looks with the person's own numbers, said in a line, and with how to add it.
 */
export function WidgetsGuideSheet() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const preview = useWidgetPreview();
  const window = useWindowDimensions();
  // The sheet's 16 pt margins, then the card's 16 pt padding.
  const stageWidth = window.width - 64;

  const header = (
    <View style={{ paddingTop: 8, paddingHorizontal: 14, paddingBottom: 6, gap: 6 }}>
      <View
        style={{
          alignSelf: 'center',
          width: 36,
          height: 5,
          borderRadius: 9,
          backgroundColor: palette.inkSoft,
          opacity: 0.35,
        }}
      />
      <View style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ ...body(17, 650), color: palette.ink }}>{t('widgetsGuide.title')}</Text>
        <PressScale
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            position: 'absolute',
            left: 0,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Symbol name="chevron_left" size={26} color={palette.ink} style={{ marginLeft: -4 }} />
          <Text style={{ ...body(17, 500), color: palette.ink }}>{t('capture.guide.back')}</Text>
        </PressScale>
        <PressScale
          accessibilityRole="button"
          onPress={() => router.dismissTo('/')}
          hitSlop={8}
          style={{ position: 'absolute', right: 0, paddingVertical: 8, paddingHorizontal: 4 }}
        >
          <Text style={{ ...body(17, 650), color: palette.ink }}>{t('common.done')}</Text>
        </PressScale>
      </View>
    </View>
  );

  return (
    <SheetFrame header={header}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 6, paddingHorizontal: 16, paddingBottom: 44, gap: 16 }}>
          <Animated.View
            entering={screenIn}
            style={{ gap: 12, paddingTop: 6, paddingHorizontal: 4, paddingBottom: 8 }}
          >
            <CategoryTile icon="widgets" hue={200} size={60} radius={20} glyph={32} />
            <Text style={{ ...leading(display(31, 500, -0.015), 33.5), color: palette.ink }}>
              {t('widgetsGuide.headline')}
            </Text>
            <Text style={{ ...body(16), lineHeight: 22, color: palette.inkSoft }}>
              {t('widgetsGuide.lede')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Symbol name="palette" size={18} color={palette.inkSoft} />
              <Text style={{ ...body(13.5, 600), color: palette.inkSoft, flex: 1 }}>
                {t(preview.ownLook ? 'widgetsGuide.lookMax' : 'widgetsGuide.lookFree')}
              </Text>
            </View>
          </Animated.View>

          <SurfaceCard
            index={1}
            icon="widgets"
            title={t('widgetsGuide.home.title')}
            what={t('widgetsGuide.home.what')}
            stepsTitle={t('widgetsGuide.howToAdd')}
            steps={[
              t('widgetsGuide.home.step1'),
              t('widgetsGuide.home.step2'),
              t('widgetsGuide.home.step3'),
            ]}
          >
            <HomeStage preview={preview} width={stageWidth} />
          </SurfaceCard>

          <SurfaceCard
            index={2}
            icon="lock"
            title={t('widgetsGuide.lock.title')}
            what={t('widgetsGuide.lock.what')}
            stepsTitle={t('widgetsGuide.howToAdd')}
            steps={[
              t('widgetsGuide.lock.step1'),
              t('widgetsGuide.lock.step2'),
              t('widgetsGuide.lock.step3'),
            ]}
          >
            <LockStage preview={preview} width={stageWidth} />
          </SurfaceCard>

          <SurfaceCard
            index={3}
            icon="tune"
            title={t('widgetsGuide.control.title')}
            needs={t('widgetsGuide.control.needs')}
            what={t('widgetsGuide.control.what')}
            stepsTitle={t('widgetsGuide.howToAdd')}
            steps={[
              t('widgetsGuide.control.step1'),
              t('widgetsGuide.control.step2'),
              t('widgetsGuide.control.step3'),
            ]}
            note={{ icon: 'flashlight_on', text: t('widgetsGuide.control.note') }}
          >
            <ControlStage width={stageWidth} />
          </SurfaceCard>

          <SurfaceCard
            index={4}
            icon="radio_button_checked"
            title={t('widgetsGuide.action.title')}
            needs={t('widgetsGuide.action.needs')}
            what={t('widgetsGuide.action.what')}
            stepsTitle={t('widgetsGuide.howToAdd')}
            steps={[
              t('widgetsGuide.action.step1'),
              t('widgetsGuide.action.step2'),
              t('widgetsGuide.action.step3'),
            ]}
            note={{ icon: 'mic', text: t('widgetsGuide.action.note') }}
          >
            <ActionStage width={stageWidth} />
          </SurfaceCard>

          <SurfaceCard
            index={5}
            icon="notifications"
            title={t('widgetsGuide.live.title')}
            what={t('widgetsGuide.live.what')}
            stepsTitle={t('widgetsGuide.whenItShows')}
            steps={[
              t('widgetsGuide.live.step1'),
              t('widgetsGuide.live.step2'),
              t('widgetsGuide.live.step3'),
            ]}
          >
            <LiveStage preview={preview} width={stageWidth} />
          </SurfaceCard>
        </View>
      </ScrollView>
    </SheetFrame>
  );
}
