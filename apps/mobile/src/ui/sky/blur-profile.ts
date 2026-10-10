/**
 * The prototype softens its blooms with `filter: blur()`, a Gaussian blur of a radial gradient.
 * Blurring a radially symmetric shape keeps it radially symmetric, so the blurred result is itself
 * a radial gradient: it is computed once here and drawn as plain gradient stops, which costs the
 * GPU nothing per frame (a live blur would re-blur a full-screen layer every frame).
 */

/** e^(−x)·I₀(x) for x ≥ 0, the scaled modified Bessel function (Abramowitz & Stegun 9.8.1–2). */
export function scaledBesselI0(x: number): number {
  if (x < 3.75) {
    const t = (x / 3.75) ** 2;
    const i0 =
      1 +
      t *
        (3.5156229 +
          t * (3.0899424 + t * (1.2067492 + t * (0.2659732 + t * (0.0360768 + t * 0.0045813)))));
    return i0 * Math.exp(-x);
  }
  const t = 3.75 / x;
  const poly =
    0.39894228 +
    t *
      (0.01328592 +
        t *
          (0.00225319 +
            t *
              (-0.00157565 +
                t *
                  (0.00916281 +
                    t * (-0.02057706 + t * (0.02635537 + t * (-0.01647633 + t * 0.00392377)))))));
  return poly / Math.sqrt(x);
}

export interface RadialProfile {
  /** Radius of the last stop, in points. */
  readonly radius: number;
  /** Stop positions as fractions of `radius`. */
  readonly positions: readonly number[];
  /** Alpha at each stop. */
  readonly alphas: readonly number[];
}

const STEPS = 400;

/**
 * Blurs a disc whose alpha is `alpha(r)` for r in [0, support] (zero beyond) with a Gaussian of
 * standard deviation `sigma`, and samples the result as `samples` evenly spaced stops out to where
 * the blur has faded (support + 3.5σ).
 */
export function blurredRadialProfile(
  alpha: (r: number) => number,
  support: number,
  sigma: number,
  samples = 32,
): RadialProfile {
  const radius = support + 3.5 * sigma;
  const positions = Array.from({ length: samples }, (_, i) => i / (samples - 1));
  if (sigma <= 0) {
    return {
      radius: support,
      positions,
      alphas: positions.map((p) => alpha(p * support)),
    };
  }
  const h = support / STEPS;
  const s2 = sigma * sigma;
  // In polar form the 2-D Gaussian blur of a radial f is the Hankel-type integral
  // g(r) = ∫ f(ρ)·(ρ/σ²)·exp(−(r−ρ)²/2σ²)·[e^(−x)·I₀(x)] dρ with x = rρ/σ² (Simpson's rule).
  const blurredAt = (r: number) => {
    let sum = 0;
    for (let i = 0; i <= STEPS; i++) {
      const rho = i * h;
      const weight = i === 0 || i === STEPS ? 1 : i % 2 === 1 ? 4 : 2;
      const kernel =
        (rho / s2) * Math.exp(-((r - rho) ** 2) / (2 * s2)) * scaledBesselI0((r * rho) / s2);
      sum += weight * alpha(rho) * kernel;
    }
    return (sum * h) / 3;
  };
  const alphas = positions.map((p, i) => (i === samples - 1 ? 0 : blurredAt(p * radius)));
  return { radius, positions, alphas };
}

const cache = new Map<string, RadialProfile>();

/**
 * A prototype bloom: a `size`×`size` circle (`border-radius: 50%`) filled with a radial gradient
 * whose alpha runs through `stops` (fractions of the farthest-corner radius), blurred by `sigma`.
 * Alphas are relative to the first stop. Memoised: a look has three blooms and two blur radii.
 */
export function bloomProfile(
  size: number,
  stops: { readonly positions: readonly number[]; readonly alphas: readonly number[] },
  sigma: number,
): RadialProfile {
  const key = `${size}|${sigma}|${stops.positions.join(',')}|${stops.alphas.join(',')}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const corner = (size / 2) * Math.SQRT2;
  const support = size / 2;
  const base = stops.alphas[0] || 1;
  const alpha = (r: number) => {
    const p = r / corner;
    const { positions, alphas } = stops;
    if (p <= (positions[0] ?? 0)) return (alphas[0] ?? 0) / base;
    for (let i = 1; i < positions.length; i++) {
      const p1 = positions[i] ?? 1;
      if (p <= p1) {
        const p0 = positions[i - 1] ?? 0;
        const t = p1 > p0 ? (p - p0) / (p1 - p0) : 1;
        return ((alphas[i - 1] ?? 0) + ((alphas[i] ?? 0) - (alphas[i - 1] ?? 0)) * t) / base;
      }
    }
    return (alphas[alphas.length - 1] ?? 0) / base;
  };
  const profile = blurredRadialProfile(alpha, support, sigma);
  cache.set(key, profile);
  return profile;
}
