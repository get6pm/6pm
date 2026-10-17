import { getLocales } from 'expo-localization';
import { StyleSheet, Text, View } from 'react-native';

import { pickLanguage } from '@6pm/i18n';
import { DEFAULT_LOOK, paletteFor } from '@6pm/theme';

import { translate as t } from '../i18n/translate';
import { PressScale } from './primitives/press-scale';
import { families } from './type/fonts';

/**
 * Shown in place of the app when the database or the first read fails. It sits above every
 * provider (no kept language, no look), so it speaks the phone's language in the default look at
 * this hour, and offers the one thing that can help: trying again.
 */
export function StartupError({ onRetry }: { readonly onRetry: () => void }) {
  const language = pickLanguage(
    getLocales().map((l) => l.languageTag),
    null,
  );
  const palette = paletteFor({ look: DEFAULT_LOOK, hour: new Date().getHours(), serious: false });
  return (
    <View style={[styles.page, { backgroundColor: palette.sheetSolid }]}>
      <Text style={[styles.title, { color: palette.ink }]}>{t(language, 'startup.failed')}</Text>
      <Text style={[styles.sub, { color: palette.inkSoft }]}>
        {t(language, 'startup.failedSub')}
      </Text>
      <PressScale
        scaleTo={0.97}
        onPress={onRetry}
        accessibilityRole="button"
        style={[styles.button, { backgroundColor: palette.btnBg }]}
      >
        <Text style={[styles.buttonLabel, { color: palette.btnFg }]}>
          {t(language, 'startup.retry')}
        </Text>
      </PressScale>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  title: { fontFamily: families.display, fontSize: 28, fontWeight: '600', letterSpacing: -0.6 },
  sub: { fontFamily: families.body, fontSize: 15, lineHeight: 21 },
  button: {
    marginTop: 16,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontFamily: families.bodySemiBold, fontSize: 16, fontWeight: '600' },
});
