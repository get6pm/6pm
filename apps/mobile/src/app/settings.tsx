import * as Application from 'expo-application';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { oklchSrgbHex } from '@6pm/theme';

import { useMoney, useMoneyStore } from '../data/money-provider';
import { DEFAULT_PLAN } from '../data/plan-settings';
import { settingsActions } from '../data/settings-actions';
import { cancelCloseReminder, scheduleCloseReminder } from '../features/onboarding/close-reminder';
import { CompanionCard } from '../features/settings/companion-card';
import { SettingRow, SettingsSection } from '../features/settings/setting-rows';
import { useI18n } from '../i18n/i18n';
import { haptics } from '../ui/haptics';
import { SheetScreen } from '../ui/navigation/sheet-screen';
import { PressScale } from '../ui/primitives/press-scale';
import { useTheme } from '../ui/theme/theme';
import { body, display } from '../ui/type/fonts';

/** The prototype's close-time stops: a tap moves to the next. */
const CLOSE_TIMES = ['17:30', '18:00', '18:30', '19:00', '21:00'];
const DELETE_RED = oklchSrgbHex(0.66, 0.19, 25);
/** How long "Tap again to delete everything" stays armed. */
const ARM_MS = 3000;

export default function Settings() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const snap = useMoney();
  const store = useMoneyStore();
  const actions = useMemo(() => settingsActions(store), [store]);
  const plan = snap.plan ?? DEFAULT_PLAN;
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const disarm = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(disarm.current), []);

  const nextCloseTime =
    CLOSE_TIMES[(CLOSE_TIMES.indexOf(plan.closeAt) + 1) % CLOSE_TIMES.length] ?? '18:00';
  const deleteAll = () => {
    haptics.tap();
    if (!armed) {
      setArmed(true);
      disarm.current = setTimeout(() => setArmed(false), ARM_MS);
      return;
    }
    clearTimeout(disarm.current);
    setLanguage(null);
    void cancelCloseReminder().catch(() => undefined);
    void actions.deleteAll().then(() => router.dismissTo('/'));
  };

  return (
    <SheetScreen title={t('home.settings')} gap={26}>
      <CompanionCard
        persona={plan.persona}
        serious={plan.serious}
        onPersona={(persona) => void actions.updatePlan({ persona })}
        onSerious={(serious) => void actions.updatePlan({ serious })}
      />

      <SettingsSection title={t('settings.yourDay')}>
        <SettingRow
          first
          icon="category"
          label={t('settings.categories')}
          value={String(snap.categories.length)}
          onPress={() => {
            haptics.tick();
            router.push('/categories');
          }}
        />
        <SettingRow
          icon="schedule"
          label={t('settings.closeTime')}
          value={plan.closeAt}
          onPress={() => {
            haptics.tick();
            void actions.updatePlan({ closeAt: nextCloseTime });
            // Moves the daily reminder; it stays silent if notifications were never allowed.
            void scheduleCloseReminder(language, nextCloseTime).catch(() => undefined);
          }}
        />
        <SettingRow
          icon="translate"
          label={t('settings.language')}
          value={t('settings.languageName')}
          onPress={() => {
            haptics.tick();
            const next = language === 'vi' ? 'en' : 'vi';
            setLanguage(next);
            void scheduleCloseReminder(next, plan.closeAt).catch(() => undefined);
          }}
        />
      </SettingsSection>

      <View style={{ gap: 8 }}>
        <SettingsSection title={t('settings.yourData')}>
          <SettingRow
            first
            icon="lock"
            label={t('settings.privacy')}
            value={t('settings.privacyValue')}
            onPress={() => {
              haptics.tick();
              setPrivacyOpen((open) => !open);
            }}
          />
          {privacyOpen ? (
            <Animated.Text
              entering={FadeIn.duration(250)}
              style={{
                ...body(13.5),
                lineHeight: 19.6,
                color: palette.inkSoft,
                paddingLeft: 58,
                paddingRight: 16,
                paddingBottom: 14,
              }}
            >
              {t('settings.privacyBody')}
            </Animated.Text>
          ) : null}
        </SettingsSection>
        <PressScale
          accessibilityRole="button"
          onPress={deleteAll}
          style={{
            height: 50,
            borderRadius: 18,
            backgroundColor: palette.cell,
            boxShadow: palette.cardShadow,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(16, 600), color: DELETE_RED }}>
            {armed ? t('settings.deleteAllConfirm') : t('settings.deleteAll')}
          </Text>
        </PressScale>
      </View>

      <View style={{ alignItems: 'center', gap: 4, paddingTop: 4, paddingHorizontal: 20 }}>
        <Text style={{ ...display(18, 500), color: palette.ink }}>6pm</Text>
        <Text style={{ ...body(13), color: palette.inkSoft }}>
          {t('settings.version', {
            version: `${Application.nativeApplicationVersion ?? ''} (${Application.nativeBuildVersion ?? ''})`,
          })}
        </Text>
      </View>
    </SheetScreen>
  );
}
