import { getLocales } from 'expo-localization';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { languages, pickLanguage, t as translate, type Language } from '@6pm/i18n';

import { RowCheck, type PickerInks } from '../features/banks/bank-picker-parts';
import { CardSheet } from '../features/diary/card-sheet';
import { useI18n } from '../i18n/i18n';
import { haptics } from '../ui/haptics';
import { PressScale } from '../ui/primitives/press-scale';
import { useTheme } from '../ui/theme/theme';
import { body } from '../ui/type/fonts';

/** A language by its own name, the same in every language: "English", "Tiếng Việt". */
const ownName = (language: Language) => translate(language, 'settings.languageName');

/**
 * Settings → Language, in the floating card sheet (three rows need no full-height sheet): follow
 * the phone, or keep one of the languages 6pm speaks. A choice is saved at once and the sheet
 * stays, already in the new language. The reminder's words follow the
 * language on their own.
 */
export default function LanguageSheet() {
  const { palette } = useTheme();
  const { t, chosen, setLanguage } = useI18n();
  const inks = useMemo(
    (): PickerInks => ({
      ink: palette.ink,
      inkSoft: palette.inkSoft,
      cell: palette.cell,
      cardShadow: palette.cardShadow,
      chipBg: palette.chipBg,
      hair: palette.hair,
      accent: palette.accent,
      accentClear: `${palette.accent}00`,
      onAccent: palette.accentFg,
    }),
    [palette],
  );
  const phone = pickLanguage(getLocales().map((l) => l.languageTag));
  const pick = (next: Language | null) => {
    if (next === chosen) return;
    haptics.tick();
    setLanguage(next);
  };

  return (
    <CardSheet>
      {(dismiss) => (
        <>
          <View style={{ minHeight: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Text accessibilityRole="header" style={{ ...body(17, 650), color: palette.ink }}>
              {t('settings.language')}
            </Text>
            <PressScale
              accessibilityRole="button"
              onPress={dismiss}
              hitSlop={8}
              style={{ position: 'absolute', right: 0, paddingVertical: 8, paddingHorizontal: 2 }}
            >
              <Text style={{ ...body(17, 650), color: palette.ink }}>{t('common.done')}</Text>
            </PressScale>
          </View>
          <View
            style={{
              borderRadius: 26,
              backgroundColor: palette.cell,
              boxShadow: palette.cardShadow,
              overflow: 'hidden',
            }}
          >
            <LanguageRow
              first
              label={t('settings.languagePhone')}
              sub={ownName(phone)}
              on={chosen === null}
              inks={inks}
              onPress={() => pick(null)}
            />
            {languages.map((language) => (
              <LanguageRow
                key={language}
                label={ownName(language)}
                on={chosen === language}
                inks={inks}
                onPress={() => pick(language)}
              />
            ))}
          </View>
        </>
      )}
    </CardSheet>
  );
}

function LanguageRow({
  label,
  sub,
  on,
  first = false,
  inks,
  onPress,
}: {
  readonly label: string;
  readonly sub?: string;
  readonly on: boolean;
  readonly first?: boolean;
  readonly inks: PickerInks;
  readonly onPress: () => void;
}) {
  return (
    <PressScale
      highlight
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      style={{ paddingHorizontal: 16 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: sub ? 11 : 14,
          borderTopWidth: 0.5,
          borderTopColor: first ? 'transparent' : inks.hair,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...body(16), color: inks.ink }}>{label}</Text>
          {sub ? <Text style={{ ...body(12.5), color: inks.inkSoft }}>{sub}</Text> : null}
        </View>
        <RowCheck on={on} inks={inks} />
      </View>
    </PressScale>
  );
}
