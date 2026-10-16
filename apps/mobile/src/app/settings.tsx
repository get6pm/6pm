import * as Application from 'expo-application';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { oklchSrgbHex } from '@6pm/theme';

import { useMoney, useMoneyStore } from '../data/money-provider';
import { DEFAULT_PLAN } from '../data/plan-settings';
import { settingsActions } from '../data/settings-actions';
import { askForReminders, cancelCloseReminder } from '../features/onboarding/close-reminder';
import {
  refreshReminderPermission,
  useReminderPermission,
} from '../features/reminders/reminder-permission';
import { BackupRow } from '../features/backup/backup-row';
import { AiSettingsRow } from '../features/privacy/ai-settings-row';
import { CaptureSettingsSection } from '../features/capture-guide/capture-settings-section';
import { useDeleteBackup } from '../features/backup/use-backup';
import { ExportRow } from '../features/export/export-row';
import { useCompanionSettingsStore } from '../features/companion/companion-settings-provider';
import { useLookSettingsStore } from '../features/looks/look-settings-provider';
import { CloseTimePicker } from '../features/settings/close-time-picker';
import { CompanionCard } from '../features/settings/companion-card';
import { SettingsCompanionRow } from '../features/settings/settings-companion-row';
import { SettingsLookCard } from '../features/settings/settings-look-card';
import { SettingsMaxCard } from '../features/settings/settings-max-card';
import { SettingRow, SettingsSection } from '../features/settings/setting-rows';
import { SettingsBanksRow } from '../features/settings/settings-banks-row';
import { useCloseTimeDraft } from '../features/settings/use-close-time-draft';
import { nativeReach } from '../features/surfaces/native-reach';
import { TravelRow } from '../features/travel/travel-row';
import { useI18n } from '../i18n/i18n';
import { haptics } from '../ui/haptics';
import { SheetScreen } from '../ui/navigation/sheet-screen';
import { PressScale } from '../ui/primitives/press-scale';
import { useToast } from '../ui/toast/toast-host';
import { useTheme } from '../ui/theme/theme';
import { body, display } from '../ui/type/fonts';

const DELETE_RED = oklchSrgbHex(0.66, 0.19, 25);
/** How long "Tap again to delete everything" stays armed. */
const ARM_MS = 3000;

export default function Settings() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t, setLanguage } = useI18n();
  const toast = useToast();
  const snap = useMoney();
  const store = useMoneyStore();
  const actions = useMemo(() => settingsActions(store), [store]);
  const lookStore = useLookSettingsStore();
  const companionStore = useCompanionSettingsStore();
  const deleteBackup = useDeleteBackup();
  const plan = snap.plan ?? DEFAULT_PLAN;
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pickingClose, setPickingClose] = useState(false);
  const reminders = useReminderPermission();
  // The wheels move the time at once; the plan (and the reminder that follows it) is saved when they rest.
  const close = useCloseTimeDraft(plan.closeAt, (closeAt) => void actions.updatePlan({ closeAt }));
  const disarm = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(disarm.current), []);

  const deleteAll = () => {
    if (deleting) return;
    haptics.tap();
    if (!armed) {
      setArmed(true);
      disarm.current = setTimeout(() => setArmed(false), ARM_MS);
      return;
    }
    clearTimeout(disarm.current);
    close.discard();
    setArmed(false);
    setDeleting(true);
    // The server copy goes first, while the key that names it is still on the phone.
    deleteBackup()
      .then(() => actions.deleteAll())
      .then(() => {
        // The data is gone: what follows must not turn a finished delete into an error.
        setLanguage(null);
        void cancelCloseReminder().catch(() => undefined);
        return Promise.all([lookStore.reload(), companionStore.reload()]).catch(() => undefined);
      })
      .then(() => router.dismissTo('/'))
      .catch(() => toast(t('settings.deleteFailed')))
      .finally(() => setDeleting(false));
  };
  const askOrOpenSettings = () => {
    haptics.tick();
    if (reminders === 'ask') {
      askForReminders()
        .then(() => refreshReminderPermission())
        .catch(() => undefined);
    } else {
      void Linking.openSettings();
    }
  };

  return (
    <SheetScreen title={t('home.settings')} gap={26}>
      <SettingsMaxCard
        onPress={() => router.push({ pathname: '/max', params: { from: 'looks' } })}
      />
      <CompanionCard
        persona={plan.persona}
        serious={plan.serious}
        onPersona={(persona) => void actions.updatePlan({ persona })}
        onSerious={(serious) => void actions.updatePlan({ serious })}
      />
      <CaptureSettingsSection
        onOpen={(source) => {
          haptics.tick();
          router.push({ pathname: '/capture-guide', params: { source } });
        }}
      />
      {/* Serious mode has no companion to pick. */}
      {plan.serious ? null : (
        <SettingsCompanionRow
          onPress={() => {
            haptics.tick();
            router.push('/companions');
          }}
        />
      )}
      {/* Replace, not push: the shop and its try-on stand in for Settings, so the app shows behind. */}
      <SettingsLookCard onPress={() => router.replace('/looks')} />

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
        <SettingsBanksRow />
        <SettingRow
          icon="schedule"
          label={t('settings.closeTime')}
          value={close.value}
          onPress={() => {
            haptics.tick();
            setPickingClose((open) => !open);
          }}
        />
        {pickingClose ? (
          <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)}>
            <CloseTimePicker closeAt={close.value} onChange={close.set} />
          </Animated.View>
        ) : null}
        {reminders !== null && reminders !== 'granted' ? (
          <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)}>
            <SettingRow
              icon="notifications_off"
              label={t('settings.reminders')}
              value={t('settings.remindersOff')}
              onPress={askOrOpenSettings}
            />
          </Animated.View>
        ) : null}
        <SettingRow
          icon="translate"
          label={t('settings.language')}
          value={t('settings.languageName')}
          onPress={() => {
            haptics.tick();
            router.push('/language');
          }}
        />
        {nativeReach.widgets ? (
          <SettingRow
            icon="widgets"
            label={t('capture.settings.widgets')}
            value={t('capture.settings.widgetsValue')}
            onPress={() => {
              haptics.tick();
              router.push({ pathname: '/capture-guide', params: { source: 'widgets' } });
            }}
          />
        ) : null}
        <TravelRow />
      </SettingsSection>

      <View style={{ gap: 8 }}>
        <SettingsSection title={t('settings.yourData')}>
          <BackupRow first />
          <AiSettingsRow />
          <SettingRow
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
          <ExportRow />
        </SettingsSection>
        <PressScale
          accessibilityRole="button"
          accessibilityState={{ busy: deleting }}
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
            {deleting
              ? t('settings.deleting')
              : armed
                ? t('settings.deleteAllConfirm')
                : t('settings.deleteAll')}
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
