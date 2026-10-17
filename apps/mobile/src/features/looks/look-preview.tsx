import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { configFor, paletteFor, type LookConfig, type LookId, lookById } from '@6pm/theme';

import { body, display } from '../../ui/type/fonts';
import { lookSignature } from './look-signature';
import { HatchLines, PreviewSun, SweepAndRings } from './look-signature-art';

/** Where a look's preview puts its sun and its "Safe today" cell, in points. */
export interface PreviewMetrics {
  readonly sunLeft: `${number}%`;
  readonly sunTop: number;
  readonly sunSize: number;
  readonly cellInset: number;
  readonly cellRadius: number;
  readonly cellPadding: readonly [top: number, sides: number, bottom: number];
  readonly labelSize: number;
  readonly numberSize: number;
  readonly numberSpacing: number;
}

/** The shop's cards (prototype `App:895-899`). */
export const SHOP_PREVIEW: PreviewMetrics = {
  sunLeft: '58%',
  sunTop: 32,
  sunSize: 38,
  cellInset: 10,
  cellRadius: 14,
  cellPadding: [8, 10, 9],
  labelSize: 9.5,
  numberSize: 23,
  numberSpacing: -0.01,
};

/** One look's palette and signature at an hour, with that look's own saved settings. */
export function useLookPreview(
  look: LookId,
  hour: number,
  config: Partial<LookConfig> | undefined,
) {
  return useMemo(() => {
    const palette = paletteFor({ look, hour, serious: false, ...(config ? { config } : {}) });
    const variant = configFor(look, config).v;
    return { palette, signature: lookSignature(look, variant, palette.st, hour) };
  }, [look, hour, config]);
}

/**
 * A static picture of a look at this hour: its sky, its signature pattern, its sun, and the
 * "Safe today" cell drawn in the look's own palette and typeface. `children` draw over the sky
 * (a badge); the caller sets the height.
 */
export function LookPreview({
  look,
  hour,
  config,
  safe,
  label,
  metrics,
  children,
}: {
  readonly look: LookId;
  readonly hour: number;
  readonly config: Partial<LookConfig> | undefined;
  /** Today's safe-to-spend, as the short text ("49k"); without it the cell is not drawn. */
  readonly safe?: string;
  /** "Safe today" in the app's language. */
  readonly label?: string;
  readonly metrics: PreviewMetrics;
  readonly children?: ReactNode;
}) {
  const { palette, signature } = useLookPreview(look, hour, config);
  const font = lookById(look).font;
  const [padTop, padSides, padBottom] = metrics.cellPadding;
  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundImage: palette.sky }}>
      {signature.image ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundImage: signature.image,
              backgroundSize: signature.size,
              backgroundRepeat: 'repeat',
            },
          ]}
        />
      ) : null}
      {signature.hatch ? <HatchLines hatch={signature.hatch} /> : null}
      {signature.rings || signature.conic ? (
        <SweepAndRings rings={signature.rings} conic={signature.conic} />
      ) : null}
      <PreviewSun
        sun={signature.sun}
        size={metrics.sunSize}
        left={metrics.sunLeft}
        top={metrics.sunTop}
      />
      {children}
      {safe === undefined ? null : (
        <View
          style={{
            position: 'absolute',
            left: metrics.cellInset,
            right: metrics.cellInset,
            bottom: metrics.cellInset,
            borderRadius: metrics.cellRadius,
            paddingTop: padTop,
            paddingHorizontal: padSides,
            paddingBottom: padBottom,
            backgroundColor: palette.cell,
            boxShadow: palette.cardShadow,
            gap: 1,
          }}
        >
          <Text
            style={{
              ...body(metrics.labelSize, 700, 0.06, palette.uiFont),
              textTransform: 'uppercase',
              color: palette.inkSoft,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              ...display(metrics.numberSize, 500, metrics.numberSpacing, font),
              // The prototype's line is 1.05 em, but iOS clips a glyph at its line box and some
              // look faces rise above that. Draw on a taller line and take the extra back out of
              // the layout, so the cell keeps its size and no face loses its top.
              lineHeight: metrics.numberSize * 1.35,
              marginVertical: -metrics.numberSize * 0.15,
              color: palette.ink,
            }}
          >
            {safe}
          </Text>
        </View>
      )}
    </View>
  );
}
