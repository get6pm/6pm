import { describe, expect, it } from '@jest/globals';

import { exportFileName, withExportFile, type ExportFolder } from './export-file';

function folder(initial: string[] = []) {
  const files = new Map(initial.map((name) => [name, '']));
  const io: ExportFolder = {
    names: () => [...files.keys()],
    write: (name, text) => {
      files.set(name, text);
      return Promise.resolve(`file:///cache/${name}`);
    },
    remove: (name) => {
      if (!files.delete(name)) throw new Error('missing');
    },
  };
  return { io, files };
}

describe('exportFileName', () => {
  it('names the file after the day it was made', () => {
    expect(exportFileName('2026-10-12')).toBe('6pm-spends-2026-10-12.csv');
  });
});

describe('withExportFile', () => {
  it('hands the written CSV to the share sheet and deletes it after the sheet closes', async () => {
    const { io, files } = folder();
    const seen = await withExportFile(io, '6pm-spends-2026-10-12.csv', 'a,b\r\n', (uri) => {
      expect(files.get('6pm-spends-2026-10-12.csv')).toBe('a,b\r\n');
      return Promise.resolve(uri);
    });
    expect(seen).toBe('file:///cache/6pm-spends-2026-10-12.csv');
    expect(files.size).toBe(0);
  });

  it('deletes the file when the share fails', async () => {
    const { io, files } = folder();
    await expect(
      withExportFile(io, '6pm-spends-2026-10-12.csv', 'x', () => Promise.reject(new Error('no'))),
    ).rejects.toThrow('no');
    expect(files.size).toBe(0);
  });

  it('sweeps CSVs an interrupted export left and nothing else', async () => {
    const { io, files } = folder(['6pm-spends-2026-10-01.csv', '6pm-receipt.png', '6pm.sqlite']);
    await withExportFile(io, '6pm-spends-2026-10-12.csv', 'x', () => Promise.resolve());
    expect([...files.keys()].sort()).toEqual(['6pm-receipt.png', '6pm.sqlite']);
  });

  it('still shares when the file is already gone at the end', async () => {
    const { io, files } = folder();
    await withExportFile(io, '6pm-spends-2026-10-12.csv', 'x', () => {
      files.clear();
      return Promise.resolve('done');
    });
    expect(files.size).toBe(0);
  });
});
