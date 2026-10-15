import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Companion } from '../../ui/companion/companion';
import { CategoryTile } from '../../ui/category-tile';
import { Symbol } from '../../ui/icons/symbol';
import { body, display } from '../../ui/type/fonts';
import type { WidgetPreview } from './preview-data';

/** The Home Screen widget sizes on a 402-point iPhone, in points. */
export const WIDGET_SIZE = {
  small: { width: 170, height: 170 },
  medium: { width: 364, height: 170 },
  large: { width: 364, height: 382 },
} as const;
export type WidgetSize = keyof typeof WIDGET_SIZE;
const RADIUS = 26;

/**
 * The 6pm Home Screen widgets, drawn from the same snapshot and measures their SwiftUI views use
 * (`SafeTodayWidget.swift`, `TodayListWidget.swift`), so the miniature is the widget itself.
 */
export function HomeWidget({
  size,
  preview,
}: {
  readonly size: WidgetSize;
  readonly preview: WidgetPreview;
}) {
  if (preview.entry === null) return <SetUp size={size} preview={preview} />;
  switch (size) {
    case 'small':
      return <Small preview={preview} />;
    case 'medium':
      return <Medium preview={preview} />;
    case 'large':
      return <Large preview={preview} />;
  }
}

function Shell({
  size,
  background,
  children,
}: {
  readonly size: WidgetSize;
  readonly background: string;
  readonly children: ReactNode;
}) {
  return (
    <View
      style={{
        ...WIDGET_SIZE[size],
        borderRadius: RADIUS,
        overflow: 'hidden',
        experimental_backgroundImage: background,
        boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
      }}
    >
      {children}
    </View>
  );
}

const solid = (colour: string | undefined) => `linear-gradient(${colour}, ${colour})`;

/** Before the month is set up: "Open 6pm to set up" on the card. */
function SetUp({ size, preview }: { readonly size: WidgetSize; readonly preview: WidgetPreview }) {
  return (
    <Shell size={size} background={solid(preview.ink['cardBg'])}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ ...body(13, 600), color: preview.ink['cardInk'], textAlign: 'center' }}>
          {preview.strings['setUp']}
        </Text>
      </View>
    </Shell>
  );
}

/** Small: the companion, then "245k" and "safe today" on the light card. */
function Small({ preview }: { readonly preview: WidgetPreview }) {
  const ink = preview.ink['cardInk'];
  return (
    <Shell size="small" background={solid(preview.ink['cardBg'])}>
      <View style={{ flex: 1, padding: 16, justifyContent: 'space-between' }}>
        <View style={{ width: 40, height: 40 }}>
          {preview.serious ? null : <Companion size={40} mood="calm" />}
        </View>
        <View style={{ gap: 2 }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            style={{ ...display(44, 500, 0, preview.palette.dispFont), color: ink }}
          >
            {preview.entry?.safeShort}
          </Text>
          <Text style={{ ...body(12, 600), color: ink, opacity: 0.6 }}>
            {preview.strings['safeTodayShort']}
          </Text>
        </View>
      </View>
    </Shell>
  );
}

/** Medium: the number on the look's sky, with Scan QR and Quick add beside it. */
function Medium({ preview }: { readonly preview: WidgetPreview }) {
  const { ink, entry } = preview;
  const skyInk = ink['skyInk'];
  const foot = [entry?.tomorrowText, entry?.pendingText].filter(Boolean).join(' · ');
  return (
    <Shell
      size="medium"
      background={`linear-gradient(160deg, ${ink['skyTop']} 0%, ${ink['skyMid']} 70%, ${ink['skyBottom']} 100%)`}
    >
      <View style={{ flex: 1, flexDirection: 'row', gap: 14, padding: 16 }}>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <Text numberOfLines={1} style={{ ...body(13, 600), color: skyInk, opacity: 0.8 }}>
            {preview.strings['safeToSpend']}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            style={{ ...display(56, 500, -0.02, preview.palette.dispFont), color: skyInk }}
          >
            {entry?.safeShort}
          </Text>
          <Text numberOfLines={1} style={{ ...body(12, 600), color: skyInk, opacity: 0.8 }}>
            {foot}
          </Text>
        </View>
        <View style={{ width: 96, gap: 8 }}>
          <ActionTile
            glyph="qr_code_scanner"
            label={preview.strings['scanQr'] ?? ''}
            background={ink['accent']}
            foreground={ink['onAccent']}
          />
          <ActionTile
            glyph="add"
            label={preview.strings['quickAdd'] ?? ''}
            background={skyInk}
            veil
            foreground={skyInk}
          />
        </View>
      </View>
    </Shell>
  );
}

/** A tile that opens the app at a screen: radius 18, a 26 pt glyph over a 12 pt label. */
function ActionTile({
  glyph,
  label,
  background,
  veil = false,
  foreground,
}: {
  readonly glyph: 'qr_code_scanner' | 'add';
  readonly label: string;
  readonly background: string | undefined;
  /** The ink at 20 %, as the Quick add tile wears it. */
  readonly veil?: boolean;
  readonly foreground: string | undefined;
}) {
  return (
    <View
      style={{ flex: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 4 }}
    >
      <View
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 18,
          backgroundColor: background,
          opacity: veil ? 0.2 : 1,
        }}
      />
      <Symbol name={glyph} size={26} {...(foreground ? { color: foreground } : {})} />
      <Text numberOfLines={1} style={{ ...body(12, 650), color: foreground }}>
        {label}
      </Text>
    </View>
  );
}

/** Large: what is left, then today's newest three spends and "+N more". */
function Large({ preview }: { readonly preview: WidgetPreview }) {
  const ink = preview.ink['cardInk'];
  const entry = preview.entry;
  if (!entry) return null;
  return (
    <Shell size="large" background={solid(preview.ink['cardBg'])}>
      <View style={{ paddingTop: 16, paddingHorizontal: 16, paddingBottom: 10, gap: 2 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            paddingBottom: 6,
          }}
        >
          <Text style={{ ...body(15, 700), color: ink }}>{preview.strings['today']}</Text>
          <Text
            numberOfLines={1}
            style={{ ...display(24, 500, 0, preview.palette.dispFont), color: ink }}
          >
            {entry.safeText}
          </Text>
        </View>
        {entry.list.length === 0 ? (
          <Line ink={ink}>
            <Text style={{ ...body(14), color: ink, opacity: 0.55 }}>
              {preview.strings['listEmpty']}
            </Text>
          </Line>
        ) : null}
        {entry.list.map((row, k) => (
          <Line key={`${row.name}-${k}`} ink={ink}>
            <CategoryTile icon={row.icon} hue={row.hue} size={26} radius={9} glyph={16} />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text numberOfLines={1} style={{ ...body(14), color: ink, flexShrink: 1 }}>
                {row.name}
              </Text>
              {row.pending ? (
                <Text style={{ ...body(11, 700, 0.04), color: preview.ink['pendingInk'] }}>
                  {(preview.strings['pendingTag'] ?? '').toUpperCase()}
                </Text>
              ) : null}
            </View>
            <Text style={{ ...body(14, 600), color: ink }}>{row.amountText}</Text>
          </Line>
        ))}
        {entry.moreText ? (
          <Line ink={ink} vertical={7}>
            <Text style={{ ...body(14), color: ink, opacity: 0.55 }}>{entry.moreText}</Text>
          </Line>
        ) : null}
      </View>
    </Shell>
  );
}

/** A row of the list with its 0.5 pt rule above it. */
function Line({
  ink,
  vertical = 6,
  children,
}: {
  readonly ink: string | undefined;
  readonly vertical?: number;
  readonly children: ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: vertical }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 0.5,
          backgroundColor: ink,
          opacity: 0.1,
        }}
      />
      {children}
    </View>
  );
}
