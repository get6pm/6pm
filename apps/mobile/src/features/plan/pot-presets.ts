import type { Vnd } from '@6pm/domain';

import type { SymbolName } from '../../ui/icons/symbols.generated';

/**
 * Goal chips over the amount keypad, by what the pot is for: a home or a car runs to billions, a
 * birthday to a few million. They are starting points; any amount can be typed.
 */
const BY_ICON: Partial<Record<SymbolName, readonly Vnd[]>> = {
  home: [500_000_000, 1_000_000_000, 2_000_000_000, 3_000_000_000, 5_000_000_000],
  directions_car: [300_000_000, 500_000_000, 800_000_000, 1_000_000_000, 1_500_000_000],
  flight: [5_000_000, 10_000_000, 20_000_000, 50_000_000, 100_000_000],
  landscape: [5_000_000, 10_000_000, 20_000_000, 50_000_000, 100_000_000],
  school: [3_000_000, 5_000_000, 10_000_000, 30_000_000, 100_000_000],
  smartphone: [5_000_000, 10_000_000, 20_000_000, 30_000_000, 50_000_000],
  laptop_mac: [10_000_000, 20_000_000, 30_000_000, 50_000_000, 80_000_000],
  child_care: [10_000_000, 30_000_000, 50_000_000, 100_000_000, 300_000_000],
  cake: [500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000],
  favorite: [500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000],
};

const ANY: readonly Vnd[] = [1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000];

export function goalPresets(icon: SymbolName): readonly Vnd[] {
  return BY_ICON[icon] ?? ANY;
}
