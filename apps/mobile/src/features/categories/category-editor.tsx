import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { oklchSrgbHex } from '@6pm/theme';

import type { CategoryInput } from '../../data/category-actions';
import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { isSymbolName } from '../../ui/icons/symbol';
import { SheetFrame } from '../../ui/navigation/sheet-frame';
import { PressScale } from '../../ui/primitives/press-scale';
import { Switch } from '../../ui/primitives/switch';
import { useTheme } from '../../ui/theme/theme';
import { body, families } from '../../ui/type/fonts';
import { HuePicker } from './hue-picker';
import { FREE_ICON_COUNT, MAX_ICON_COUNT } from './icon-packs';
import { IconPicker } from './icon-picker';
import { mayAutoPick } from './icon-suggestion';
import { useIconAutoPick } from './use-icon-auto-pick';

const DELETE_RED = oklchSrgbHex(0.66, 0.19, 25);

/**
 * Makes or edits a category: name, icon, colour and whether it counts toward the day. It is a
 * native sheet over the Categories sheet, so it drags down anywhere or from the top of its scroll
 * like every other sheet. Cancel, Save and Delete all close it through `onClose`.
 */
export function CategoryEditor({
  initial,
  title,
  deleteLabel,
  onSave,
  onDelete,
  onClose,
}: {
  readonly initial: CategoryInput;
  readonly title: string;
  /** "Delete · its spends move to Food"; null when this one cannot be deleted. */
  readonly deleteLabel: string | null;
  readonly onSave: (draft: CategoryInput) => void;
  readonly onDelete: () => void;
  readonly onClose: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const [draft, setDraft] = useState(initial);
  // Set once the sheet starts to leave, so a second tap cannot save or delete twice.
  const leaving = useRef(false);
  const dismiss = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    onClose();
  }, [onClose]);

  // The icon follows the name until the person picks one; renaming never replaces a hand pick.
  const [autoPick, setAutoPick] = useState(() => mayAutoPick(initial));
  const pickIcon = useCallback((icon: string) => {
    setAutoPick(false);
    setDraft((d) => ({ ...d, icon }));
  }, []);
  useIconAutoPick({
    name: draft.name,
    enabled: autoPick && draft.name !== initial.name,
    onPick: (icon) => setDraft((d) => (d.icon === icon ? d : { ...d, icon })),
  });
  const pickHue = useCallback((hue: number) => setDraft((d) => ({ ...d, hue })), []);
  const named = draft.name.trim() !== '';
  const label = (text: string) => (
    <Text style={{ ...body(12, 600, 0.05), textTransform: 'uppercase', color: palette.inkSoft }}>
      {text}
    </Text>
  );

  const header = (
    <View style={{ paddingTop: 8, paddingHorizontal: 18, gap: 6 }}>
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
        <Text style={{ ...body(17, 650), color: palette.ink }}>{title}</Text>
        <PressScale
          accessibilityRole="button"
          onPress={dismiss}
          hitSlop={8}
          style={{ position: 'absolute', left: 0, paddingVertical: 6 }}
        >
          <Text style={{ ...body(16), color: palette.inkSoft }}>{t('categories.edit.cancel')}</Text>
        </PressScale>
        <PressScale
          accessibilityRole="button"
          accessibilityState={{ disabled: !named }}
          disabled={!named}
          onPress={() => {
            if (leaving.current) return;
            onSave(draft);
            dismiss();
          }}
          hitSlop={8}
          style={{ position: 'absolute', right: 0, paddingVertical: 6 }}
        >
          <Text style={{ ...body(16, 700), color: palette.ink, opacity: named ? 1 : 0.35 }}>
            {t('categories.edit.save')}
          </Text>
        </PressScale>
      </View>
    </View>
  );

  return (
    <SheetFrame header={header}>
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          paddingTop: 18,
          paddingHorizontal: 18,
          paddingBottom: 44,
          gap: 18,
        }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', gap: 12 }}>
          <CategoryTile
            icon={isSymbolName(draft.icon) ? draft.icon : 'payments'}
            hue={draft.hue}
            size={68}
            radius={23}
            glyph={36}
          />
          <TextInput
            value={draft.name}
            onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
            placeholder={t('categories.edit.placeholder')}
            placeholderTextColor={palette.inkSoft}
            returnKeyType="done"
            maxLength={40}
            style={{
              alignSelf: 'stretch',
              textAlign: 'center',
              padding: 0,
              fontFamily: families.display,
              fontSize: 28,
              fontWeight: '500',
              letterSpacing: -0.28,
              color: palette.ink,
            }}
          />
        </View>
        <View style={{ gap: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingHorizontal: 2,
            }}
          >
            {label(t('categories.edit.icon'))}
            <Text style={{ ...body(12.5), color: palette.inkSoft }}>
              {t('categories.edit.iconCount', { free: FREE_ICON_COUNT, more: MAX_ICON_COUNT })}
            </Text>
          </View>
          <IconPicker icon={draft.icon} hue={draft.hue} onPick={pickIcon} />
        </View>
        <View style={{ gap: 10 }}>
          <View style={{ paddingHorizontal: 2 }}>{label(t('categories.edit.colour'))}</View>
          <HuePicker hue={draft.hue} label={t('categories.edit.colour')} onPick={pickHue} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 12,
            paddingLeft: 16,
            paddingRight: 14,
            borderRadius: 20,
            backgroundColor: palette.cell,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...body(15.5, 600), color: palette.ink }}>
              {t('categories.edit.daily')}
            </Text>
            <Text style={{ ...body(12.5), lineHeight: 12.5 * 1.35, color: palette.inkSoft }}>
              {t('categories.edit.dailySub')}
            </Text>
          </View>
          <Switch
            value={draft.countsDaily}
            onChange={(countsDaily) => setDraft((d) => ({ ...d, countsDaily }))}
            accessibilityLabel={t('categories.edit.daily')}
          />
        </View>
        {deleteLabel ? (
          <PressScale
            accessibilityRole="button"
            onPress={() => {
              if (leaving.current) return;
              onDelete();
              dismiss();
            }}
            style={{
              height: 46,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(15, 600), color: DELETE_RED }}>{deleteLabel}</Text>
          </PressScale>
        ) : null}
      </ScrollView>
    </SheetFrame>
  );
}
