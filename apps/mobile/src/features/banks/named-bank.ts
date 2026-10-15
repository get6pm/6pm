/**
 * A bank or wallet 6pm has no entry for, saved by the name the person typed. Saved with a prefix
 * among the chosen wallets, so a name can never be read as a catalogue code ("MB", "CASH").
 */
const PREFIX = 'name:';
/** Longer than any bank's everyday name; keeps a pasted paragraph out of the grid. */
const MAX_LENGTH = 40;

/** The name as typed, tidied: spaces collapsed, trimmed, kept short. Empty when there is none. */
export function tidyBankName(typed: string): string {
  return typed.replace(/\s+/g, ' ').trim().slice(0, MAX_LENGTH).trim();
}

/** The saved code for a typed name, or null when there is no name. */
export function namedBankId(typed: string): string | null {
  const name = tidyBankName(typed);
  return name === '' ? null : PREFIX + name;
}

/** The typed name a saved code holds, or null for a catalogue code. */
export function bankNameOf(id: string): string | null {
  return id.startsWith(PREFIX) ? id.slice(PREFIX.length) || null : null;
}

/** Whether a saved code is a typed name. */
export function isNamedBank(id: string): boolean {
  return bankNameOf(id) !== null;
}
