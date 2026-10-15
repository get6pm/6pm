import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { useAppIconSupported } from '../features/app-icon/app-icon';
import {
  useCompanionSettings,
  useCompanionSettingsStore,
} from '../features/companion/companion-settings-provider';
import { CompanionTile } from '../features/companions/companion-tile';
import { canUseCompanion, resolveCompanion } from '../features/purchases/entitlement';
import { useEntitlement } from '../features/purchases/purchases-provider';
import { useI18n } from '../i18n/i18n';
import { COMPANION_FORMS, isMaxForm, type CompanionForm } from '../ui/companion/companion-mood';
import { haptics } from '../ui/haptics';
import { SheetScreen } from '../ui/navigation/sheet-screen';
import { Switch } from '../ui/primitives/switch';
import { useTheme } from '../ui/theme/theme';
import { body } from '../ui/type/fonts';

/** How long a just-picked companion stays happy, its arrival playing. */
const CELEBRATE_MS = 2400;

/** The six companions two to a row, in the catalogue's order. */
const ROWS: readonly (readonly CompanionForm[])[] = [
  COMPANION_FORMS.slice(0, 2),
  COMPANION_FORMS.slice(2, 4),
  COMPANION_FORMS.slice(4, 6),
];

/**
 * The companion picker: every companion live, the one worn marked, the Max ones locked for
 * non-members (a tap opens Max for them). Picking one puts it on everywhere at once and plays its
 * arrival with a success haptic. Under them, the app icon can follow the pick.
 */
export default function Companions() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();
  const settings = useCompanionSettings();
  const store = useCompanionSettingsStore();
  const { customer } = useEntitlement();
  const iconSupported = useAppIconSupported();
  const worn = resolveCompanion(settings, customer);
  const [celebrating, setCelebrating] = useState<CompanionForm | null>(null);
  const [cues, setCues] = useState<Readonly<Partial<Record<CompanionForm, number>>>>({});
  const calm = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(calm.current), []);

  const pick = (form: CompanionForm) => {
    if (!canUseCompanion(form, customer)) {
      haptics.tick();
      router.push({ pathname: '/max', params: { from: 'buddy', companion: form } });
      return;
    }
    if (form === worn && settings.chosen !== null) {
      haptics.tick();
      return;
    }
    store.choose(form, (f) => canUseCompanion(f, customer));
    haptics.success();
    setCues((current) => ({ ...current, [form]: (current[form] ?? 0) + 1 }));
    setCelebrating(form);
    clearTimeout(calm.current);
    calm.current = setTimeout(() => setCelebrating(null), CELEBRATE_MS);
  };

  return (
    <SheetScreen title={t('companions.title')} gap={14}>
      <Text style={{ ...body(14.5), lineHeight: 21, color: palette.inkSoft, paddingHorizontal: 6 }}>
        {t('companions.intro')}
      </Text>
      {ROWS.map((row) => (
        <View key={row.join()} style={{ flexDirection: 'row', gap: 12 }}>
          {row.map((form) => (
            <CompanionTile
              key={form}
              form={form}
              worn={form === worn}
              locked={isMaxForm(form) && !canUseCompanion(form, customer)}
              celebrating={celebrating === form}
              cue={cues[form] ?? 0}
              onPress={() => pick(form)}
            />
          ))}
        </View>
      ))}
      {iconSupported ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 22,
            backgroundColor: palette.cell,
            boxShadow: palette.cardShadow,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...body(16), color: palette.ink }}>{t('companions.icon')}</Text>
            <Text style={{ ...body(12.5), color: palette.inkSoft }}>{t('companions.iconSub')}</Text>
          </View>
          <Switch
            value={settings.icon}
            onChange={(on) => {
              haptics.tick();
              store.setIcon(on);
            }}
            accessibilityLabel={t('companions.icon')}
          />
        </View>
      ) : null}
    </SheetScreen>
  );
}
