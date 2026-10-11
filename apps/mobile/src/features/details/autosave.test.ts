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
    const save = jest.fn();
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
    const save = jest.fn();
    const note = createAutosave(null, save);
    note.change(' lunch with Lan ');
    note.flush();
    expect(save).toHaveBeenCalledWith('lunch with Lan');
    jest.advanceTimersByTime(5000);
    note.flush();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('saves a cleared note as nothing, and skips an unchanged one', () => {
    const save = jest.fn();
    const note = createAutosave('old', save);
    note.change('old');
    note.flush();
    expect(save).not.toHaveBeenCalled();
    note.change('   ');
    note.flush();
    expect(save).toHaveBeenCalledWith(null);
  });
});
