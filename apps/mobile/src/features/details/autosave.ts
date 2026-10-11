/**
 * Saves text as it is typed, a moment after the last keystroke, and straight away when asked (the
 * field loses focus, the sheet is dismissed). Never saves the same value twice, so flushing on every
 * exit route is safe. A value counts as saved only once `save` has finished: when it rejects, the
 * text stays unsaved and the next flush (another keystroke, losing focus, leaving) writes it again.
 * Writes never overlap; text typed during one is written right after it.
 */
export function createAutosave(
  initial: string | null,
  save: (value: string | null) => Promise<void> | void,
  delayMs = 600,
) {
  let saved = initial;
  let latest: string | null = initial;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let writing = false;

  const flush = async (): Promise<void> => {
    clearTimeout(timer);
    timer = undefined;
    // The write in progress picks up anything newer when it finishes.
    if (writing) return;
    writing = true;
    try {
      while (latest !== saved) {
        const value = latest;
        try {
          await save(value);
        } catch {
          return;
        }
        saved = value;
      }
    } finally {
      writing = false;
    }
  };

  return {
    /** The text changed; an empty or blank text is saved as nothing. */
    change: (text: string) => {
      latest = text.trim() === '' ? null : text.trim();
      clearTimeout(timer);
      timer = setTimeout(() => void flush(), delayMs);
    },
    flush,
  };
}
