import {
  alignmentCentres,
  BLOCKS,
  dataCodewords,
  ECC_PER_BLOCK,
  FORMAT_BITS,
  rawDataModules,
  type QrLevel,
} from './qr-tables';
import { utf8 } from './utf8';

/** A QR Code as dark (true) and light modules, row by row: `rows[y][x]`. */
export interface QrMatrix {
  readonly size: number;
  readonly rows: readonly (readonly boolean[])[];
}

export interface QrOptions {
  /** Error-correction level; M by default, dropping to L only when the text does not fit at M. */
  level?: QrLevel;
  /** A fixed mask 0–7; by default the one ISO/IEC 18004 scores best. */
  mask?: number;
}

/**
 * Draws a text as a QR Code in byte mode (UTF-8), at the smallest version that holds it, so a
 * scanned payment code can be saved as a picture a bank app reads back exactly. Throws a
 * RangeError when the text is longer than a QR Code can hold.
 */
export function encodeQR(text: string, options: QrOptions = {}): QrMatrix {
  const bytes = utf8(text);
  const levels: QrLevel[] = options.level ? [options.level] : ['M', 'L'];
  for (const level of levels) {
    for (let version = 1; version <= 40; version++) {
      const countBits = version <= 9 ? 8 : 16;
      const capacity = dataCodewords(version, level) * 8;
      if (4 + countBits + bytes.length * 8 <= capacity) {
        return draw(version, level, codewords(bytes, version, level, countBits), options.mask);
      }
    }
  }
  throw new RangeError('Text too long for a QR Code');
}

/** Mode, count and data bits, padded to the version's data capacity, then error correction. */
function codewords(bytes: number[], version: number, level: QrLevel, countBits: number) {
  const bits: number[] = [];
  const put = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  put(0b0100, 4);
  put(bytes.length, countBits);
  for (const b of bytes) put(b, 8);
  const capacity = dataCodewords(version, level) * 8;
  put(0, Math.min(4, capacity - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
  }
  return withErrorCorrection(data, version, level);
}

/** Splits the data into blocks, adds each block's Reed–Solomon codewords, and interleaves. */
function withErrorCorrection(data: number[], version: number, level: QrLevel): number[] {
  const blockCount = BLOCKS[level][version] ?? 1;
  const eccLength = ECC_PER_BLOCK[level][version] ?? 0;
  const total = Math.floor(rawDataModules(version) / 8);
  const shortCount = blockCount - (total % blockCount);
  const shortLength = Math.floor(total / blockCount);
  const divisor = rsDivisor(eccLength);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < blockCount; i++) {
    const block = data.slice(k, k + shortLength - eccLength + (i < shortCount ? 0 : 1));
    k += block.length;
    const ecc = rsRemainder(block, divisor);
    if (i < shortCount) block.push(0);
    blocks.push([...block, ...ecc]);
  }
  const out: number[] = [];
  for (let i = 0; i < shortLength + 1; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortLength - eccLength || j >= shortCount) out.push(block[i] ?? 0);
    });
  }
  return out;
}

function draw(version: number, level: QrLevel, data: number[], fixedMask?: number): QrMatrix {
  const size = version * 4 + 17;
  const dark = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fixed = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (x: number, y: number, on: boolean) => {
    dark[y]![x] = on;
    fixed[y]![x] = true;
  };

  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ] as const) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        const ring = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, ring !== 2 && ring !== 4);
      }
    }
  }
  const centres = alignmentCentres(version);
  const last = centres.length - 1;
  centres.forEach((cx, i) =>
    centres.forEach((cy, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++)
          set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }),
  );
  drawFormat(set, size, level, 0);
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const on = ((bits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, on);
      set(b, a, on);
    }
  }

  // Data runs in two-module columns from the right, zigzagging up and down, skipping column 6.
  let bit = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
        if (!fixed[y]![x] && bit < data.length * 8) {
          dark[y]![x] = (((data[bit >>> 3] ?? 0) >>> (7 - (bit & 7))) & 1) === 1;
          bit++;
        }
      }
    }
  }

  const masked = (mask: number) => {
    const rows = dark.map((row, y) =>
      row.map((on, x) => (fixed[y]![x] ? on : on !== MASKS[mask]!(x, y))),
    );
    drawFormat((x, y, on) => (rows[y]![x] = on), size, level, mask);
    return rows;
  };
  if (fixedMask !== undefined) return { size, rows: masked(fixedMask) };
  let best = masked(0);
  let bestScore = penalty(best);
  for (let mask = 1; mask < 8; mask++) {
    const rows = masked(mask);
    const score = penalty(rows);
    if (score < bestScore) [best, bestScore] = [rows, score];
  }
  return { size, rows: best };
}

const MASKS: readonly ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function drawFormat(
  set: (x: number, y: number, on: boolean) => void,
  size: number,
  level: QrLevel,
  mask: number,
) {
  const data = (FORMAT_BITS[level] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const on = (i: number) => ((bits >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) set(8, i, on(i));
  set(8, 7, on(6));
  set(8, 8, on(7));
  set(7, 8, on(8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, on(i));
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, on(i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, on(i));
  set(8, size - 8, true);
}

/** The ISO/IEC 18004 mask score: long runs, 2×2 blocks, finder look-alikes, dark/light balance. */
function penalty(rows: boolean[][]): number {
  const size = rows.length;
  const line = (i: number, vertical: boolean) =>
    Array.from({ length: size }, (_, k) => (vertical ? rows[k]![i]! : rows[i]![k]!));
  const finder = [true, false, true, true, true, false, true];
  let score = 0;
  for (let i = 0; i < size; i++) {
    for (const vertical of [false, true]) {
      const cells = line(i, vertical);
      for (let k = 0, run = 1; k < size; k++, run++) {
        if (k === size - 1 || cells[k] !== cells[k + 1]) {
          if (run >= 5) score += run - 2;
          run = 0;
        }
      }
      for (let k = 0; k + 7 <= size; k++) {
        if (!finder.every((v, d) => cells[k + d] === v)) continue;
        const lightBefore = k >= 4 && cells.slice(k - 4, k).every((v) => !v);
        const lightAfter = k + 11 <= size && cells.slice(k + 7, k + 11).every((v) => !v);
        if (lightBefore || lightAfter) score += 40;
      }
    }
  }
  let darkCount = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (rows[y]![x]) darkCount++;
      const c = rows[y]![x];
      if (
        x < size - 1 &&
        y < size - 1 &&
        rows[y]![x + 1] === c &&
        rows[y + 1]![x] === c &&
        rows[y + 1]![x + 1] === c
      )
        score += 3;
    }
  }
  const total = size * size;
  score += (Math.ceil(Math.abs(darkCount * 20 - total * 10) / total) - 1) * 10;
  return score;
}

function rsMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = rsMultiply(result[j]!, root);
      if (j + 1 < degree) result[j]! ^= result[j + 1]!;
    }
    root = rsMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() ?? 0);
    result.push(0);
    divisor.forEach((coef, i) => (result[i]! ^= rsMultiply(coef, factor)));
  }
  return result;
}
