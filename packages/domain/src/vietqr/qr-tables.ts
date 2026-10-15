/**
 * The capacity tables of ISO/IEC 18004 (QR Code), for error-correction levels L and M, indexed by
 * version 1–40 (index 0 is unused).
 */

export type QrLevel = 'L' | 'M';

/** Error-correction codewords in each block. */
export const ECC_PER_BLOCK: Readonly<Record<QrLevel, readonly number[]>> = {
  L: [
    -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30,
    30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  M: [
    -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
};

/** Number of error-correction blocks the data is split into. */
export const BLOCKS: Readonly<Record<QrLevel, readonly number[]>> = {
  L: [
    -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14,
    15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  M: [
    -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23,
    25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
};

/** The two bits a level writes into the format information. */
export const FORMAT_BITS: Readonly<Record<QrLevel, number>> = { L: 1, M: 0 };

/** Modules left for data and error correction once the fixed patterns are drawn. */
export function rawDataModules(version: number): number {
  let modules = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    modules -= (25 * align - 10) * align - 55;
    if (version >= 7) modules -= 36;
  }
  return modules;
}

/** Data codewords a version holds at a level, error correction aside. */
export function dataCodewords(version: number, level: QrLevel): number {
  const eccBlocks = (BLOCKS[level][version] ?? 0) * (ECC_PER_BLOCK[level][version] ?? 0);
  return Math.floor(rawDataModules(version) / 8) - eccBlocks;
}

/** Centres of the alignment patterns along each axis. */
export function alignmentCentres(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2;
  const centres = [6];
  for (let pos = version * 4 + 17 - 7; centres.length < count; pos -= step) {
    centres.splice(1, 0, pos);
  }
  return centres;
}
