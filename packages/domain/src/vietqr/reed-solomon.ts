/** Reed–Solomon error correction over GF(2⁸) with the QR Code polynomial 0x11D. */

/** Product of two field elements. */
function rsMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

/** The generator polynomial of a degree, highest term dropped. */
export function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      const next = j + 1 < degree ? (result[j + 1] ?? 0) : 0;
      result[j] = rsMultiply(result[j] ?? 0, root) ^ next;
    }
    root = rsMultiply(root, 0x02);
  }
  return result;
}

/** The error-correction codewords of a block: its remainder by the divisor. */
export function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() ?? 0);
    result.push(0);
    divisor.forEach((coef, i) => (result[i] = (result[i] ?? 0) ^ rsMultiply(coef, factor)));
  }
  return result;
}
