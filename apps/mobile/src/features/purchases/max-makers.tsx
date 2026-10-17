import { Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { body, display, leading } from '../../ui/type/fonts';
import { MAX_CREAM, MAX_FONT, MAX_GOLD } from './max-colours';

/**
 * "From the makers" (prototype `App:1102-1116`): who makes 6pm, that it is open source, why Max
 * exists, and a way to the source. Bánh Bao waves from the corner.
 */
export function MaxMakers({ onSource }: { readonly onSource: () => void }) {
  const { t } = useI18n();
  return (
    <View
      style={{
        overflow: 'hidden',
        borderRadius: 26,
        paddingTop: 22,
        paddingHorizontal: 20,
        paddingBottom: 18,
        backgroundImage:
          'linear-gradient(170deg, rgba(255,210,122,.14) 0%, rgba(255,255,255,.04) 55%, rgba(255,255,255,.03) 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.1), inset 0 1px 0 rgba(255,255,255,.14)',
        gap: 16,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: -30,
          top: -36,
          width: 150,
          height: 150,
          borderRadius: 75,
          backgroundImage:
            'radial-gradient(circle, rgba(255,210,122,.28), rgba(255,210,122,0) 70%)',
        }}
      />
      <View pointerEvents="none" style={{ position: 'absolute', right: 14, top: 12 }}>
        <Companion size={72} mood="wave" form="banhbao" />
      </View>
      <View style={{ gap: 6, paddingRight: 84 }}>
        <Text style={{ ...body(11, 800, 0.12), textTransform: 'uppercase', color: MAX_GOLD }}>
          {t('max.makers.kicker')}
        </Text>
        <Text
          accessibilityRole="header"
          style={{ ...leading(display(22, 600, -0.015, MAX_FONT), 24.2), color: MAX_CREAM }}
        >
          {t('max.makers.title')}
        </Text>
      </View>
      <Text style={{ ...body(13.5), lineHeight: 19.6, color: 'rgba(246,239,230,.8)' }}>
        {t('max.makers.body')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <PressScale
          accessibilityRole="link"
          scaleTo={0.96}
          onPress={() => {
            haptics.tick();
            onSource();
          }}
          style={{
            height: 38,
            paddingLeft: 12,
            paddingRight: 14,
            borderRadius: 99,
            backgroundColor: 'rgba(255,255,255,.1)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.12)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Symbol name="code" size={18} color={MAX_CREAM} />
          <Text style={{ ...body(13, 700), color: MAX_CREAM }}>{t('max.makers.source')}</Text>
        </PressScale>
        <View
          style={{
            height: 38,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Symbol name="task_alt" size={18} color={MAX_GOLD} />
          <Text style={{ ...body(13, 600), color: 'rgba(246,239,230,.7)' }}>
            {t('max.makers.noAds')}
          </Text>
        </View>
      </View>
    </View>
  );
}
