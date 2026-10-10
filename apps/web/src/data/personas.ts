export type Persona = 'Soft' | 'Cheeky' | 'Roast';

/** The companion's voices: mood, glow and three lines of a day. */
export const personas: Readonly<
  Record<Persona, { mood: string; glow: string; lines: readonly (readonly [string, string])[] }>
> = {
  Soft: {
    mood: 'calm',
    glow: 'radial-gradient(circle, #ffb070, transparent 70%)',
    lines: [
      ['09:12', 'Calm day so far. I’ve got the receipts.'],
      ['18:00', 'Tomorrow’s a little roomier. Nice close.'],
      ['22:40', 'No rush. Two minutes before bed?'],
    ],
  },
  Cheeky: {
    mood: 'wave',
    glow: 'radial-gradient(circle, #ff8552, transparent 70%)',
    lines: [
      ['09:12', 'Suspiciously well-behaved today.'],
      ['18:00', 'Under a minute. Show-off.'],
      ['22:40', 'Still open. I’ll wait. Patiently-ish.'],
    ],
  },
  Roast: {
    mood: 'nod',
    glow: 'radial-gradient(circle, #e8607a, transparent 70%)',
    lines: [
      ['09:12', 'Wallet’s still breathing. Impressive.'],
      ['18:00', 'Adulting on a Friday. Look at you.'],
      ['22:40', 'Day’s still open. So is your wallet.'],
    ],
  },
};
