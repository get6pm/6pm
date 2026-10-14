import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEFAULT_LOOK, paletteFor } from '@6pm/theme';

import { Companion } from '../../ui/companion/companion';
import {
  COMPANION_FORMS,
  companionMoods,
  type CompanionForm,
} from '../../ui/companion/companion-mood';
import { body } from '../../ui/type/fonts';

// A developer gallery of every mood, size and form on a dark and a light ground, for checking the
// companion against the prototype on a simulator. Its labels are identifiers, not interface copy.

const SIZES = [96] as const;
const FORMS = COMPANION_FORMS;
const evening = paletteFor({ look: DEFAULT_LOOK, hour: 18, serious: false });
const GROUNDS = [
  { name: 'dark', background: evening.sheetSolid, ink: evening.ink },
  { name: 'light', background: evening.bubbleBg, ink: evening.bubbleFg },
] as const;

/** Tap to step through the forms: each arrival plays its entrance. */
function FormSwitch() {
  const [form, setForm] = useState<CompanionForm>('sun');
  const ground = GROUNDS[0];
  return (
    <Pressable
      onPress={() => setForm((f) => FORMS[(FORMS.indexOf(f) + 1) % FORMS.length] ?? 'sun')}
      style={{ backgroundColor: ground.background, padding: 16, gap: 8 }}
    >
      <Text style={[body(13, 600), { color: ground.ink }]}>{`tap · ${form}`}</Text>
      <Companion size={120} mood="happy" form={form} />
    </Pressable>
  );
}

function Gallery() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <FormSwitch />
      {GROUNDS.map((ground) => (
        <View
          key={ground.name}
          style={{ backgroundColor: ground.background, padding: 16, gap: 20 }}
        >
          {FORMS.flatMap((form) =>
            SIZES.map((size) => (
              <View key={`${form}-${size}`} style={{ gap: 8 }}>
                <Text style={[body(13, 600), { color: ground.ink }]}>
                  {`${ground.name} · ${form} · ${size}`}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {companionMoods.map((mood) => (
                    <View key={mood} style={{ alignItems: 'center' }}>
                      <Companion size={size} mood={mood} form={form} />
                      <Text style={[body(11), { color: ground.ink, opacity: 0.7 }]}>{mood}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )),
          )}
        </View>
      ))}
    </ScrollView>
  );
}

export default function CompanionGalleryScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Gallery />;
}
