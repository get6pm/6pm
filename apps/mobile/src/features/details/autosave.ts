/**
 * Saves text as it is typed, a moment after the last keystroke, and straight away when asked (the
 * field loses focus, the sheet is dismissed). Never saves the same value twice, so flushing on every
 * exit route is safe.
 */
export function createAutosave(
  initial: string | null,
  save: (value: string | null) => void,
  delayMs = 600,
) {
  let saved = initial;
  let latest: string | null = initial;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    if (latest === saved) return;
    saved = latest;
    save(latest);
  };

  return {
    /** The text changed; an empty or blank text is saved as nothing. */
    change: (text: string) => {
      latest = text.trim() === '' ? null : text.trim();
      clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    flush,
  };
}
