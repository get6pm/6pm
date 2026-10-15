import { useMemo } from 'react';

import type { SurfaceSnapshot } from '@6pm/domain';
import { paletteFor, type Palette } from '@6pm/theme';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { symbolCodepoints, type SymbolName } from '../../ui/icons/symbols.generated';
import { useLookSettings } from '../looks/look-settings-provider';
import { resolveLook } from '../purchases/entitlement';
import { useEntitlement } from '../purchases/purchases-provider';
import { widgetLook, widgetTokens } from '../surfaces/surface-palette';
import { surfaceSnapshot } from '../surfaces/surface-snapshot';

type Entry = SurfaceSnapshot['entries'][number];

/** One spend of the large widget, with its glyph as the app names it. */
export interface PreviewRow {
  readonly name: string;
  readonly amountText: string;
  readonly icon: SymbolName;
  readonly hue: number;
  readonly pending: boolean;
}

/** What the widgets show right now, worked out exactly as the app writes it for them. */
export interface WidgetPreview {
  /** This money day's entry; null before the month is set up ("Open 6pm to set up"). */
  readonly entry: (Omit<Entry, 'list'> & { readonly list: readonly PreviewRow[] }) | null;
  readonly strings: SurfaceSnapshot['strings'];
  /** The widgets' colours this hour, by the names Swift reads them under. */
  readonly ink: Readonly<Record<string, string>>;
  /** The look the widgets wear this hour: its display face sets the big number. */
  readonly palette: Palette;
  /** The widgets wear the person's own look (Max), not Golden Hour. */
  readonly ownLook: boolean;
  /** Serious mode: no companion on the small widget. */
  readonly serious: boolean;
}

const byCodepoint = new Map<number, SymbolName>(
  (Object.entries(symbolCodepoints) as [SymbolName, number][]).map(([name, code]) => [code, name]),
);

function nameOfGlyph(glyph: string): SymbolName {
  return byCodepoint.get(glyph.codePointAt(0) ?? 0) ?? 'payments';
}

/**
 * The widgets as they stand: the same snapshot the app hands to WidgetKit (the person's numbers,
 * spends and words), in the colours of the current hour. The guide draws its miniatures from it,
 * so what it shows is what the person will see once they add one.
 */
export function useWidgetPreview(): WidgetPreview {
  const money = useMoney();
  const { t } = useI18n();
  const format = useMoneyFormat();
  const { look, config } = useLookSettings();
  const { customer, max } = useEntitlement();
  const serious = money.plan?.serious ?? false;
  const worn = resolveLook(look, customer);
  const ownConfig = config[worn];
  const hour = new Date().getHours();

  return useMemo(() => {
    const widget = widgetLook({
      max,
      look: worn,
      serious,
      ...(ownConfig ? { config: ownConfig } : {}),
    });
    const snapshot = surfaceSnapshot({
      money,
      look: widget,
      maxLook: max ? worn : null,
      t,
      format,
      writtenAt: new Date(),
    });
    const palette = paletteFor({
      look: widget.look,
      hour,
      serious: widget.serious,
      ...(widget.config ? { config: widget.config } : {}),
    });
    const first = snapshot.entries[0];
    return {
      entry: first
        ? {
            ...first,
            list: first.list.map((row) => ({ ...row, icon: nameOfGlyph(row.icon) })),
          }
        : null,
      strings: snapshot.strings,
      ink: widgetTokens(palette),
      palette,
      ownLook: max,
      serious,
    };
  }, [money, max, worn, ownConfig, serious, t, format, hour]);
}
