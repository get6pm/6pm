import { lookById, type LookControl, type LookId } from '@6pm/theme';

import type { I18n } from '../../i18n/i18n';

type Translate = I18n['t'];

/** Looks whose name reads the same in Vietnamese: the engine's name is used as it is. */
const NAME_AS_ENGINE: ReadonlySet<LookId> = new Set(['lacquer', 'glaze', 'riso', 'cafe', 'neon']);

/** Variants that read the same in Vietnamese (a place or a phrase of its own), as `look.index`. */
const VARIANT_AS_ENGINE: ReadonlySet<string> = new Set([
  'golden.1',
  'golden.2',
  'lacquer.0',
  'lacquer.1',
  'glaze.0',
  'glaze.1',
  'monsoon.1',
  'cafe.0',
  'cafe.1',
  'neon.0',
  'neon.1',
  'paper.1',
  'lantern.0',
  'lantern.1',
]);

/**
 * A look's words in the app's language. The theme engine holds the English; the catalogue holds
 * the Vietnamese for everything that differs, under keys built from the look's id. The keys are
 * built here, so the copy test checks every one resolves.
 */
export function lookCopy(t: Translate) {
  // Keys are built from the engine's own ids; the copy test proves each exists.
  const say = (key: string) => (t as (key: string) => string)(key);
  return {
    name: (id: LookId) => (NAME_AS_ENGINE.has(id) ? lookById(id).name : say(`looks.name.${id}`)),
    tag: (id: LookId) => say(`looks.tag.${id}`),
    intensity: (id: LookId) => say(`looks.kName.${id}`),
    controlLabel: (id: LookId, control: LookControl) => say(`looks.ctl.${id}.${control.key}.label`),
    controlSub: (id: LookId, control: LookControl) => say(`looks.ctl.${id}.${control.key}.sub`),
    variant: (id: LookId, index: number) =>
      VARIANT_AS_ENGINE.has(`${id}.${index}`)
        ? (lookById(id).variants[index]?.name ?? '')
        : say(`looks.variant.${id}.${index}`),
  };
}

export type LookCopy = ReturnType<typeof lookCopy>;
