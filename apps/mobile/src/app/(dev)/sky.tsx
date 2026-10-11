import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { configFor, isLookId, LOOK_IDS, lookById, type LookConfig } from '@6pm/theme';

import { Sky } from '../../ui/sky/sky';
import { body, mono, tabular } from '../../ui/type/fonts';

// A developer screen for comparing the sky with the prototype's renders (design/renders/sky):
// scrub the hour, switch look, variant, intensity, effects and serious mode. Tap the sky to hide
// the panel. Its labels are identifiers, not interface copy.

const LOOKS = LOOK_IDS;
type SkyLook = (typeof LOOKS)[number];

/** The prototype's presets: 18:07 is its designed Friday (18.12). */
const PRESETS: readonly (readonly [string, number])[] = [
  ['08:30', 8.5],
  ['14:00', 14],
  ['18:07', 18.12],
  ['21:30', 21.5],
];
const FIRST_HOUR = 6;
const LAST_HOUR = 23 + 59 / 60;

const INK = '#f6efe6';
const PANEL = 'rgba(11,9,18,.72)';
const CHIP = 'rgba(246,239,230,.12)';

function clockOf(hour: number): string {
  const minutes = Math.round(hour * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function Chip({
  label,
  on,
  onPress,
}: {
  readonly label: string;
  readonly on: boolean;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 99,
        backgroundColor: on ? INK : CHIP,
      }}
    >
      <Text style={[body(13, 600), { color: on ? '#1b1e2e' : INK }]}>{label}</Text>
    </Pressable>
  );
}

function Row({ children }: { readonly children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {children}
    </View>
  );
}

/** A track the finger drags along: reports a value between `min` and `max`. */
function Scrubber({
  value,
  min,
  max,
  onChange,
}: {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly onChange: (value: number) => void;
}) {
  const [width, setWidth] = useState(1);
  const pick = (x: number) =>
    onChange(min + (Math.max(0, Math.min(width, x)) / width) * (max - min));
  const drag = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => pick(e.x))
    .onUpdate((e) => pick(e.x));
  const fraction = (value - min) / (max - min);
  return (
    <GestureDetector gesture={drag}>
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: 32, justifyContent: 'center' }}
      >
        <View style={{ height: 4, borderRadius: 2, backgroundColor: CHIP }} />
        <View
          style={{
            position: 'absolute',
            left: fraction * width - 10,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: INK,
          }}
        />
      </View>
    </GestureDetector>
  );
}

function Label({ children }: { readonly children: ReactNode }) {
  return <Text style={[mono(11, 500, 0.14), { color: 'rgba(246,239,230,.6)' }]}>{children}</Text>;
}

function SkyLab() {
  const insets = useSafeAreaInsets();
  // `?look=neon&hour=21.5&panel=0` opens a state directly, for headless screenshots.
  const params = useLocalSearchParams<{ look?: string; hour?: string; panel?: string }>();
  const [hour, setHour] = useState(params.hour ? Number(params.hour) : 18.12);
  const [look, setLook] = useState<SkyLook>(isLookId(params.look) ? params.look : 'golden');
  const [configs, setConfigs] = useState<Partial<Record<SkyLook, Partial<LookConfig>>>>({});
  const [serious, setSerious] = useState(false);
  const [panel, setPanel] = useState(params.panel !== '0');

  const definition = lookById(look);
  const override = configs[look];
  const config = configFor(look, override);
  const update = (patch: Partial<LookConfig>) =>
    setConfigs((all) => ({ ...all, [look]: { ...all[look], ...patch } }));

  const k = Number(config.k);
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Sky look={look} hour={hour} serious={serious} {...(override ? { config: override } : {})} />
      <Pressable style={{ flex: 1 }} onPress={() => setPanel((p) => !p)} />
      {panel && (
        <View
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: insets.bottom + 12,
            padding: 14,
            gap: 10,
            borderRadius: 22,
            backgroundColor: PANEL,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Label>TIME OF DAY</Label>
            <Text style={[mono(13, 600), tabular, { color: INK }]}>{clockOf(hour)}</Text>
          </View>
          <Scrubber
            value={hour}
            min={FIRST_HOUR}
            max={LAST_HOUR}
            onChange={(h) => setHour(Math.round(h * 60) / 60)}
          />
          <Row>
            {PRESETS.map(([label, h]) => (
              <Chip
                key={label}
                label={label}
                on={Math.abs(hour - h) < 0.03}
                onPress={() => setHour(h)}
              />
            ))}
          </Row>
          <Row>
            {LOOKS.map((id) => (
              <Chip
                key={id}
                label={lookById(id).name}
                on={look === id}
                onPress={() => setLook(id)}
              />
            ))}
            <Chip label="Serious" on={serious} onPress={() => setSerious((s) => !s)} />
          </Row>
          <Row>
            {definition.variants.map((variant, i) => (
              <Chip
                key={variant.name}
                label={variant.name}
                on={config.v === i}
                onPress={() => update({ v: i })}
              />
            ))}
          </Row>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Label>{definition.kName.toUpperCase()}</Label>
            <Text style={[mono(13, 600), tabular, { color: INK }]}>{`k ${k}`}</Text>
          </View>
          <Scrubber
            value={k}
            min={0}
            max={100}
            onChange={(value) => update({ k: Math.round(value) })}
          />
          <Row>
            {definition.ctl.map((control) => (
              <Chip
                key={control.key}
                label={control.label}
                on={Boolean(config[control.key])}
                onPress={() => update({ [control.key]: !config[control.key] })}
              />
            ))}
          </Row>
        </View>
      )}
    </View>
  );
}

export default function SkyLabScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <SkyLab />;
}
