/** A barcode that is the same for the same day: bar widths from the receipt number. */
export function barcode(seed: number): number[] {
  let x = seed || 1;
  return Array.from({ length: 40 }, () => {
    x = (x * 9301 + 49297) % 233280;
    return 1 + Math.floor((x / 233280) * 3);
  });
}
