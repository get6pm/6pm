import { useMemo } from 'react';

import { paletteFor, type LookConfig, type LookId } from '@6pm/theme';

/** One look's palette at an hour, with that look's own saved settings. */
export function useLookPreview(
  look: LookId,
  hour: number,
  config: Partial<LookConfig> | undefined,
) {
  return useMemo(
    () => ({ palette: paletteFor({ look, hour, serious: false, ...(config ? { config } : {}) }) }),
    [look, hour, config],
  );
}
