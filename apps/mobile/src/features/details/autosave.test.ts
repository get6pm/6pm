import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createAutosave } from './autosave';

describe('createAutosave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('saves a moment after the last keystroke, once', () => {
    const save = jest.fn<(value: string | null) => void>();
    const note = createAutosave(null, save, 600);
    note.change('p');
    jest.advanceTimersByTime(400);
    note.change('phở');
    jest.advanceTimersByTime(599);
    expect(save).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('phở');
  });

  it('saves at once on flush, and the later timer does not save it again', () => {
    const save = jest.fn<(value: string | null) => void>();
    const note = createAutosave(null, save);
    note.change(' lunch with Lan ');
    void note.flush();
    expect(save).toHaveBeenCalledWith('lunch with Lan');
    jest.advanceTimersByTime(5000);
    void note.flush();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('saves a cleared note as nothing, and skips an unchanged one', () => {
    const save = jest.fn<(value: string | null) => void>();
    const note = createAutosave('old', save);
    note.change('old');
    void note.flush();
    expect(save).not.toHaveBeenCalled();
    note.change('   ');
    void note.flush();
    expect(save).toHaveBeenCalledWith(null);
  });

  it('writes a note again on the next flush when the first write failed', async () => {
    const save = jest.fn<(value: string | null) => Promise<void>>();
    save.mockRejectedValueOnce(new Error('disk'));
    const note = createAutosave(null, save);
    note.change('lunch with Lan');
    await note.flush();
    expect(save).toHaveBeenCalledTimes(1);
    await note.flush();
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith('lunch with Lan');
    await note.flush();
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('writes text typed during a write right after it, never two at once', async () => {
    let finish: () => void = () => undefined;
    const save = jest.fn<(value: string | null) => Promise<void>>(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const note = createAutosave(null, save);
    note.change('a');
    const first = note.flush();
    note.change('ab');
    void note.flush();
    expect(save).toHaveBeenCalledTimes(1);
    finish();
    for (let i = 0; i < 5; i++) await Promise.resolve();
    finish();
    await first;
    expect(save.mock.calls.map(([value]) => value)).toEqual(['a', 'ab']);
  });
});
