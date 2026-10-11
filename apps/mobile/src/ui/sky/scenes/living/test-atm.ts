import { atmosphereFor, paletteFor, type LookConfig, type LookId } from '@6pm/theme';

/** The prototype's atmosphere for a look at an hour, as the scenes receive it. */
export function atmFor(look: LookId, hour: number, config?: Partial<LookConfig>) {
  const input = { look, hour, serious: false, ...(config ? { config } : {}) };
  return atmosphereFor(input, paletteFor(input), 0);
}
