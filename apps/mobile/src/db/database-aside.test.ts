import { describe, expect, it } from '@jest/globals';

import { moveDatabaseAside, type DatabaseFiles } from './database-aside';

function directory(initial: string[]): DatabaseFiles & { files: Set<string> } {
  const files = new Set(initial);
  return {
    files,
    names: () => [...files],
    rename: (from, to) => {
      if (!files.has(from)) throw new Error(`no ${from}`);
      files.delete(from);
      files.add(to);
    },
    remove: (name) => {
      files.delete(name);
    },
  };
}

describe('moveDatabaseAside', () => {
  it('renames the file and its log to a dated name in the same directory', () => {
    const dir = directory(['sixpm.db', 'sixpm.db-wal', 'sixpm.db-shm', 'other.db']);
    const stamp = moveDatabaseAside(dir, 'sixpm.db', new Date('2026-10-11T12:34:56.789Z'));
    expect(stamp).toBe('20261011T123456Z');
    expect([...dir.files].sort()).toEqual([
      'other.db',
      'sixpm.db-shm.aside-20261011T123456Z',
      'sixpm.db-wal.aside-20261011T123456Z',
      'sixpm.db.aside-20261011T123456Z',
    ]);
  });

  it('keeps only the newest moved-aside copy', () => {
    const dir = directory([
      'sixpm.db',
      'sixpm.db.aside-20260901T000000Z',
      'sixpm.db-wal.aside-20260901T000000Z',
      'sixpm.db.aside-20260915T000000Z',
    ]);
    moveDatabaseAside(dir, 'sixpm.db', new Date('2026-10-11T00:00:00Z'));
    expect([...dir.files]).toEqual(['sixpm.db.aside-20261011T000000Z']);
  });

  it('does nothing on a fresh install, and leaves a newer copy alone', () => {
    expect(moveDatabaseAside(directory([]), 'sixpm.db', new Date())).toBeNull();
    const dir = directory(['sixpm.db.aside-20261201T000000Z']);
    expect(moveDatabaseAside(dir, 'sixpm.db', new Date('2026-10-11T00:00:00Z'))).toBeNull();
    expect([...dir.files]).toEqual(['sixpm.db.aside-20261201T000000Z']);
  });

  it('throws when a file cannot be moved, so the caller can fall back', () => {
    const dir = directory(['sixpm.db']);
    dir.rename = () => {
      throw new Error('disk full');
    };
    expect(() => moveDatabaseAside(dir, 'sixpm.db', new Date())).toThrow('disk full');
    expect(dir.files.has('sixpm.db')).toBe(true);
  });
});
