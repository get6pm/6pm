import {
  ColorShader,
  FractalNoise,
  LinearGradient,
  RadialGradient,
  Shader,
  Skia,
  SweepGradient,
  Turbulence,
  vec,
} from '@shopify/react-native-skia';
import type { ReactElement } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import type { Rgba } from '../../css-values';
import type { BgLayer, Gradient, Noise, Stop } from './box-css';
import { gradientGeometry } from './box-gradients';

/** CSS blends gradient colours in premultiplied space; Skia's flag 1 does the same. */
const PREMUL = 1;

const rgba = (c: Rgba): number[] => [c[0], c[1], c[2], c[3]];

/** Repeats a child shader every `size` points from `origin`, optionally along x only. */
const TILE = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float2 origin;
uniform float2 size;
uniform float repeatY;

half4 main(float2 p) {
  float2 q = p - origin;
  if (repeatY < 0.5 && (q.y < 0.0 || q.y >= size.y)) return half4(0.0);
  q = q - size * floor(q / size);
  return image.eval(q);
}
`);

/** An SVG noise texture: the noise through its colour matrix (in straight colour, as SVG). */
const NOISE = Skia.RuntimeEffect.Make(`
uniform shader noise;
uniform float4 rowR;
uniform float4 rowG;
uniform float4 rowB;
uniform float4 rowA;
uniform float4 bias;

half4 main(float2 p) {
  half4 c = noise.eval(p);
  float4 u = c.a > 0.0 ? float4(c.rgb / c.a, c.a) : float4(0.0);
  float4 o = clamp(float4(dot(rowR, u), dot(rowG, u), dot(rowB, u), dot(rowA, u)) + bias, 0.0, 1.0);
  return half4(o.rgb * o.a, o.a);
}
`);

/** Conic stop positions for this exposure (`--exp`), on the UI thread. */
function conicPositions(stops: readonly Stop[], exp: number): number[] {
  'worklet';
  const out: number[] = [];
  let floor = 0;
  for (let i = 0; i < stops.length; i++) {
    const at = stops[i]?.at;
    let p: number;
    if (at && at.kind === 'deg') p = (at.k * exp + at.c) / 360;
    else if (at && at.kind === 'len') p = at.len.v / 100;
    else p = i === 0 ? 0 : i === stops.length - 1 ? 1 : floor;
    floor = Math.min(1, Math.max(floor, p));
    out.push(floor);
  }
  return out;
}

function ConicShader({
  c,
  fromDeg,
  stops,
  exp,
}: {
  readonly c: { x: number; y: number };
  readonly fromDeg: number;
  readonly stops: readonly Stop[];
  readonly exp: SharedValue<number>;
}) {
  const positions = useDerivedValue(() => conicPositions(stops, exp.value));
  return (
    <SweepGradient
      c={vec(c.x, c.y)}
      start={fromDeg - 90}
      end={fromDeg + 270}
      colors={stops.map((s) => rgba(s.color))}
      positions={positions}
      flags={PREMUL}
    />
  );
}

function noiseShader(n: Noise) {
  const m = n.matrix;
  const row = (i: number) => [m[i] ?? 0, m[i + 1] ?? 0, m[i + 2] ?? 0, m[i + 3] ?? 0];
  const props = {
    freqX: n.freq[0],
    freqY: n.freq[1],
    octaves: n.octaves,
    seed: n.seed,
    tileWidth: n.tile[0],
    tileHeight: n.tile[1],
  };
  if (!NOISE) return null;
  return (
    <Shader
      source={NOISE}
      uniforms={{
        rowR: row(0),
        rowG: row(5),
        rowB: row(10),
        rowA: row(15),
        bias: [m[4] ?? 0, m[9] ?? 0, m[14] ?? 0, m[19] ?? 0],
      }}
    >
      {n.fractal ? <FractalNoise {...props} /> : <Turbulence {...props} />}
    </Shader>
  );
}

/** One gradient (or colour, or noise) as a shader over a w×h area from its own top-left. */
export function gradientShader(
  g: Gradient,
  w: number,
  h: number,
  exp: SharedValue<number>,
): ReactElement | null {
  if (g.kind === 'color') return <ColorShader color={rgba(g.color)} />;
  if (g.kind === 'noise') return noiseShader(g.noise);
  const geo = gradientGeometry(g, w, h);
  if (!geo) return null;
  switch (geo.kind) {
    case 'linear':
      return (
        <LinearGradient
          start={vec(geo.start.x, geo.start.y)}
          end={vec(geo.end.x, geo.end.y)}
          colors={geo.stops.colors.map(rgba)}
          positions={[...geo.stops.positions]}
          mode={geo.repeat ? 'repeat' : 'clamp'}
          flags={PREMUL}
        />
      );
    case 'radial':
      return (
        <RadialGradient
          c={vec(geo.c.x, geo.c.y)}
          r={geo.rx}
          colors={geo.stops.colors.map(rgba)}
          positions={[...geo.stops.positions]}
          origin={vec(geo.c.x, geo.c.y)}
          transform={[{ scaleY: geo.ry / geo.rx }]}
          flags={PREMUL}
        />
      );
    case 'conic':
      return <ConicShader c={geo.c} fromDeg={geo.fromDeg} stops={geo.stops} exp={exp} />;
  }
}

/**
 * A background layer over a w×h box: its image at its own size, repeated from its position (the
 * `<x> <y> / <w> <h>` of the shorthand), or once over the whole box.
 */
export function layerShader(
  layer: BgLayer,
  w: number,
  h: number,
  exp: SharedValue<number>,
): ReactElement | null {
  const tw = layer.size ? resolve(layer.size[0], w) : w;
  const th = layer.size ? resolve(layer.size[1], h) : h;
  const noiseTile = layer.image.kind === 'noise' ? layer.image.noise.tile : null;
  const tileW = noiseTile ? noiseTile[0] : tw;
  const tileH = noiseTile ? noiseTile[1] : th;
  const inner = gradientShader(layer.image, tileW, tileH, exp);
  const sized = layer.size !== null || noiseTile !== null;
  if (!inner || !sized || !TILE || layer.image.kind === 'color') return inner;
  return (
    <Shader
      source={TILE}
      uniforms={{
        origin: [resolve(layer.pos[0], w), resolve(layer.pos[1], h)],
        size: [Math.max(0.5, tileW), Math.max(0.5, tileH)],
        repeatY: layer.repeat === 'repeat-x' ? 0 : 1,
      }}
    >
      {inner}
    </Shader>
  );
}

const resolve = (l: { v: number; unit: 'px' | '%' }, ref: number) =>
  l.unit === '%' ? (l.v / 100) * ref : l.v;
